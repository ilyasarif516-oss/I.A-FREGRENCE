import { useMemo, useState } from 'react';
import {
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { OrderRecord, OrderStatus } from '../../types/store';
import { formatPKR } from '../../utils/format';

interface AdminOrdersTabProps {
  selectedOrder: OrderRecord | null;
  onSelectOrder: (order: OrderRecord) => void;
  onCloseOrder: () => void;
}

const ORDER_STATUSES: Array<{ value: OrderStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_TEXT_CLASS: Record<OrderStatus, string> = {
  pending: 'text-[#D97706] border-[#D97706]/30 bg-[#D97706]/8',
  confirmed: 'text-[#0B0B0D] border-black/20 bg-black/5',
  processing: 'text-[#0B0B0D] border-black/25 bg-[#F4CBD8]/35',
  shipped: 'text-[#0B0B0D] border-[#D997AD] bg-[#FDF5F8]',
  delivered: 'text-[#16A34A] border-[#16A34A]/30 bg-[#16A34A]/8',
  cancelled: 'text-[#DC2626] border-[#DC2626]/30 bg-[#DC2626]/8',
};

function formatOrderDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AdminOrdersTab({
  selectedOrder,
  onSelectOrder,
  onCloseOrder,
}: AdminOrdersTabProps) {
  const {
    orders,
    isOrdersLoading,
    isSupabaseConnected,
    refreshOrders,
    changeOrderStatus,
    showToast,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.orderStatus !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.toLowerCase().includes(q) ||
        order.city.toLowerCase().includes(q) ||
        order.customerEmail.toLowerCase().includes(q)
      );
    });
  }, [orders, searchQuery, statusFilter]);

  const activeModalOrder = useMemo(() => {
    if (!selectedOrder) return null;
    return orders.find((o) => o.id === selectedOrder.id) ?? selectedOrder;
  }, [orders, selectedOrder]);

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      setUpdatingOrderId(orderId);
      await changeOrderStatus(orderId, nextStatus);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Unable to update order status.'
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar: Search + Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#0B0B0D]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, customer, phone, or city..."
            aria-label="Search orders"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
          />
        </div>

        {isSupabaseConnected && (
          <button
            type="button"
            disabled={isOrdersLoading}
            onClick={() => refreshOrders()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-black/15 bg-white text-xs font-medium text-[#0B0B0D] hover:border-black transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0 min-h-[42px]"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isOrdersLoading ? 'animate-spin' : ''}`}
            />
            <span>{isOrdersLoading ? 'Refreshing...' : 'Refresh Orders'}</span>
          </button>
        )}
      </div>

      {/* Status Filter Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-2 rounded-full text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            statusFilter === 'all'
              ? 'bg-[#0B0B0D] text-white border-[#0B0B0D]'
              : 'bg-white text-[#0B0B0D]/70 border-black/15 hover:border-black'
          }`}
        >
          All ({orders.length})
        </button>

        {ORDER_STATUSES.map((st) => {
          const count = orders.filter((o) => o.orderStatus === st.value).length;
          return (
            <button
              key={st.value}
              type="button"
              onClick={() => setStatusFilter(st.value)}
              className={`px-3.5 py-2 rounded-full text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                statusFilter === st.value
                  ? 'bg-[#0B0B0D] text-white border-[#0B0B0D]'
                  : 'bg-white text-[#0B0B0D]/70 border-black/15 hover:border-black'
              }`}
            >
              {st.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Orders List / Table */}
      <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
        {isOrdersLoading && orders.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#0B0B0D]" />
            <p className="text-sm text-[#0B0B0D]/65">Loading customer orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-11 h-11 rounded-full bg-[#FAF8F9] border border-black/10 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-5 h-5 text-[#0B0B0D]/45" />
            </div>
            <p className="font-display text-2xl font-semibold text-[#0B0B0D]">
              {orders.length === 0 ? 'No orders yet' : 'No matching orders'}
            </p>
            <p className="text-sm text-[#0B0B0D]/60 max-w-sm mx-auto">
              {orders.length === 0
                ? 'Customer Cash on Delivery orders placed from the storefront will appear here.'
                : 'Try adjusting your status filter or clearing the search field.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-xs text-[#0B0B0D]/55 uppercase tracking-[0.12em] bg-[#FAF8F9]">
                    <th className="py-3.5 px-5 font-medium">Order</th>
                    <th className="py-3.5 px-4 font-medium">Customer</th>
                    <th className="py-3.5 px-4 font-medium">City</th>
                    <th className="py-3.5 px-4 font-medium">Items</th>
                    <th className="py-3.5 px-4 font-medium">Total</th>
                    <th className="py-3.5 px-4 font-medium">Status</th>
                    <th className="py-3.5 px-5 font-medium text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/8">
                  {filteredOrders.map((order) => {
                    const itemCount = order.items.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    );
                    const isUpdating = updatingOrderId === order.id;

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-[#FAF8F9]/70 transition-colors"
                      >
                        <td className="py-4 px-5 whitespace-nowrap">
                          <p className="font-semibold text-[#0B0B0D] tabular-nums">
                            {order.orderNumber}
                          </p>
                          <p className="text-xs text-[#0B0B0D]/50 tabular-nums mt-0.5">
                            {formatOrderDate(order.createdAt)}
                          </p>
                        </td>

                        <td className="py-4 px-4">
                          <p className="font-medium text-[#0B0B0D]">
                            {order.customerName}
                          </p>
                          <p className="text-xs text-[#0B0B0D]/55 tabular-nums mt-0.5">
                            {order.customerPhone}
                          </p>
                        </td>

                        <td className="py-4 px-4 text-[#0B0B0D]/75 whitespace-nowrap">
                          {order.city}
                        </td>

                        <td className="py-4 px-4 text-xs text-[#0B0B0D]/75 tabular-nums whitespace-nowrap">
                          {itemCount} {itemCount === 1 ? 'bottle' : 'bottles'}
                        </td>

                        <td className="py-4 px-4 font-semibold text-[#0B0B0D] tabular-nums whitespace-nowrap">
                          {formatPKR(order.total)}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <select
                            aria-label={`Change status for ${order.orderNumber}`}
                            value={order.orderStatus}
                            disabled={isUpdating}
                            onChange={(e) =>
                              handleStatusChange(
                                order.id,
                                e.target.value as OrderStatus
                              )
                            }
                            className={`px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B0B0D] disabled:opacity-60 ${
                              STATUS_TEXT_CLASS[order.orderStatus]
                            }`}
                          >
                            {ORDER_STATUSES.map((st) => (
                              <option
                                key={st.value}
                                value={st.value}
                                className="bg-white text-[#0B0B0D]"
                              >
                                {st.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onSelectOrder(order)}
                            className="px-3.5 py-1.5 rounded-full border border-black/15 text-xs font-medium text-[#0B0B0D] hover:border-black transition-colors cursor-pointer"
                          >
                            View Order
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-black/8">
              {filteredOrders.map((order) => {
                const isUpdating = updatingOrderId === order.id;
                const itemCount = order.items.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                );

                return (
                  <div key={order.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm text-[#0B0B0D] tabular-nums">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-[#0B0B0D]/55 tabular-nums">
                          {formatOrderDate(order.createdAt)}
                        </p>
                      </div>
                      <p className="font-semibold text-sm text-[#0B0B0D] tabular-nums">
                        {formatPKR(order.total)}
                      </p>
                    </div>

                    <div className="text-xs text-[#0B0B0D]/75 space-y-0.5">
                      <p className="font-medium text-[#0B0B0D]">
                        {order.customerName} · {order.city}
                      </p>
                      <p className="tabular-nums">
                        {order.customerPhone} · {itemCount}{' '}
                        {itemCount === 1 ? 'item' : 'items'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <select
                        aria-label={`Change status for ${order.orderNumber}`}
                        value={order.orderStatus}
                        disabled={isUpdating}
                        onChange={(e) =>
                          handleStatusChange(
                            order.id,
                            e.target.value as OrderStatus
                          )
                        }
                        className={`px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer ${
                          STATUS_TEXT_CLASS[order.orderStatus]
                        }`}
                      >
                        {ORDER_STATUSES.map((st) => (
                          <option
                            key={st.value}
                            value={st.value}
                            className="bg-white text-[#0B0B0D]"
                          >
                            {st.label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => onSelectOrder(order)}
                        className="px-3.5 py-1.5 rounded-full border border-black/15 text-xs font-medium text-[#0B0B0D] hover:border-black cursor-pointer"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Detailed Order Modal */}
      <AnimatePresence>
        {activeModalOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseOrder}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`Order ${activeModalOrder.orderNumber}`}
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-black/10 flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-5 bg-[#0B0B0D] text-white flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#F4CBD8]">
                    Customer Order
                  </p>
                  <h3 className="font-display text-2xl font-semibold tabular-nums">
                    {activeModalOrder.orderNumber}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onCloseOrder}
                  aria-label="Close order details"
                  className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Status + Date Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#FAF8F9] border border-black/10">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-[#0B0B0D]/55">
                      Placed On
                    </p>
                    <p className="text-sm font-medium text-[#0B0B0D] tabular-nums mt-0.5">
                      {formatOrderDate(activeModalOrder.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="modal-order-status"
                      className="text-xs uppercase tracking-[0.12em] text-[#0B0B0D]/55"
                    >
                      Status
                    </label>
                    <select
                      id="modal-order-status"
                      value={activeModalOrder.orderStatus}
                      disabled={updatingOrderId === activeModalOrder.id}
                      onChange={(e) =>
                        handleStatusChange(
                          activeModalOrder.id,
                          e.target.value as OrderStatus
                        )
                      }
                      className={`px-3.5 py-2 rounded-full border text-xs font-semibold cursor-pointer ${
                        STATUS_TEXT_CLASS[activeModalOrder.orderStatus]
                      }`}
                    >
                      {ORDER_STATUSES.map((st) => (
                        <option
                          key={st.value}
                          value={st.value}
                          className="bg-white text-[#0B0B0D]"
                        >
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Customer & Delivery Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-black/10 space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/55">
                      Customer Information
                    </p>
                    <p className="text-sm font-semibold text-[#0B0B0D]">
                      {activeModalOrder.customerName}
                    </p>
                    <p className="text-xs text-[#0B0B0D]/75 inline-flex items-center gap-1.5 tabular-nums">
                      <Phone className="w-3.5 h-3.5 text-[#0B0B0D]/45" />
                      <span>{activeModalOrder.customerPhone}</span>
                    </p>
                    {activeModalOrder.customerEmail && (
                      <p className="text-xs text-[#0B0B0D]/65 break-all">
                        {activeModalOrder.customerEmail}
                      </p>
                    )}
                    <p className="text-xs text-[#0B0B0D]/60 pt-1">
                      Payment: <span className="font-semibold text-[#0B0B0D]">{activeModalOrder.paymentMethod}</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-black/10 space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/55">
                      Delivery Address
                    </p>
                    <p className="text-sm font-semibold text-[#0B0B0D] inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0B0B0D]/45" />
                      <span>{activeModalOrder.city}</span>
                    </p>
                    <p className="text-xs text-[#0B0B0D]/75 leading-relaxed">
                      {activeModalOrder.shippingAddress}
                    </p>
                    {activeModalOrder.orderNotes && (
                      <div className="pt-2 border-t border-black/8">
                        <p className="text-[11px] uppercase tracking-[0.12em] text-[#0B0B0D]/50">
                          Order Notes
                        </p>
                        <p className="text-xs text-[#0B0B0D]/80 mt-0.5">
                          {activeModalOrder.orderNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ordered Items */}
                <div className="border border-black/10 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 bg-[#FAF8F9] border-b border-black/8">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/60">
                      Ordered Perfumes
                    </p>
                  </div>
                  <div className="divide-y divide-black/8">
                    {activeModalOrder.items.map((item, idx) => (
                      <div
                        key={item.id ?? `${item.productId}-${idx}`}
                        className="px-4 py-3 flex items-center justify-between gap-4 text-sm"
                      >
                        <div>
                          <p className="font-medium text-[#0B0B0D]">
                            {item.productName}
                          </p>
                          <p className="text-xs text-[#0B0B0D]/55 tabular-nums">
                            Qty {item.quantity} × {formatPKR(item.unitPrice)}
                          </p>
                        </div>
                        <p className="font-semibold text-[#0B0B0D] tabular-nums">
                          {formatPKR(item.totalPrice)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="px-4 py-4 bg-[#FAF8F9] border-t border-black/10 space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#0B0B0D]/70">
                      <span>Subtotal</span>
                      <span className="tabular-nums">
                        {formatPKR(activeModalOrder.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#0B0B0D]/70">
                      <span>Delivery Charges</span>
                      <span className="tabular-nums">
                        {activeModalOrder.shippingFee === 0
                          ? 'Complimentary'
                          : formatPKR(activeModalOrder.shippingFee)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-[#0B0B0D] pt-2 border-t border-black/10">
                      <span>Total Amount</span>
                      <span className="tabular-nums">
                        {formatPKR(activeModalOrder.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-black/10 bg-[#FAF8F9] flex justify-end">
                <button
                  type="button"
                  onClick={onCloseOrder}
                  className="px-5 py-2.5 rounded-full bg-[#0B0B0D] text-white text-xs font-medium hover:bg-[#222228] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
