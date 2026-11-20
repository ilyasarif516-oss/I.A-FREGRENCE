import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Package,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { OrderRecord, OrderStatus } from '../../types/store';
import { formatPKR } from '../../utils/format';

interface AdminOverviewTabProps {
  onSelectOrder: (order: OrderRecord) => void;
}

const STATUS_BADGE_MAP: Record<OrderStatus, string> = {
  pending: 'text-[#D97706]',
  confirmed: 'text-[#0B0B0D]',
  processing: 'text-[#0B0B0D]',
  shipped: 'text-[#0B0B0D]',
  delivered: 'text-[#16A34A]',
  cancelled: 'text-[#DC2626]',
};

const SUMMARY_STATUSES: Array<{ key: OrderStatus; label: string; barColor: string }> = [
  { key: 'pending', label: 'Pending', barColor: 'bg-[#D97706]' },
  { key: 'confirmed', label: 'Confirmed', barColor: 'bg-[#0B0B0D]/70' },
  { key: 'processing', label: 'Processing', barColor: 'bg-[#0B0B0D]' },
  { key: 'shipped', label: 'Shipped', barColor: 'bg-[#D997AD]' },
  { key: 'delivered', label: 'Delivered', barColor: 'bg-[#16A34A]' },
  { key: 'cancelled', label: 'Cancelled', barColor: 'bg-[#DC2626]' },
];

export function AdminOverviewTab({ onSelectOrder }: AdminOverviewTabProps) {
  const { products, orders, setActiveAdminSection } = useStore();

  const nonCancelledOrders = orders.filter((o) => o.orderStatus !== 'cancelled');
  const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingCount = orders.filter((o) => o.orderStatus === 'pending').length;
  const completedCount = orders.filter((o) => o.orderStatus === 'delivered').length;
  const activeProductsCount = products.filter((p) => p.isActive).length;
  const averageOrderValue =
    nonCancelledOrders.length > 0
      ? Math.round(totalRevenue / nonCancelledOrders.length)
      : 0;

  const recentOrders = orders.slice(0, 6);

  const kpis = [
    {
      label: 'Total Revenue',
      value: formatPKR(totalRevenue),
      subtext: `Avg. order ${formatPKR(averageOrderValue)}`,
      icon: TrendingUp,
    },
    {
      label: 'Total Orders',
      value: String(orders.length),
      subtext: `${nonCancelledOrders.length} active orders`,
      icon: ShoppingBag,
    },
    {
      label: 'Pending Orders',
      value: String(pendingCount),
      subtext: 'Awaiting confirmation',
      icon: Clock,
    },
    {
      label: 'Completed Orders',
      value: String(completedCount),
      subtext: 'Delivered to customers',
      icon: CheckCircle2,
    },
    {
      label: 'Total Products',
      value: String(products.length),
      subtext: `${activeProductsCount} active on storefront`,
      icon: Package,
    },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white border border-black/10 rounded-2xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/55">
                  {kpi.label}
                </span>
                <Icon className="w-4 h-4 text-[#0B0B0D]/45" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#0B0B0D] tabular-nums">
                  {kpi.value}
                </p>
                <p className="text-xs text-[#0B0B0D]/55 mt-1 tabular-nums">
                  {kpi.subtext}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Split: Sales Summary + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Summary Breakdown */}
        <section className="lg:col-span-5 bg-white border border-black/10 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-black/8">
            <div>
              <h2 className="text-base font-semibold text-[#0B0B0D]">
                Sales Summary
              </h2>
              <p className="text-xs text-[#0B0B0D]/55 mt-0.5">
                Order pipeline breakdown by fulfillment status
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {SUMMARY_STATUSES.map((status) => {
              const matching = orders.filter((o) => o.orderStatus === status.key);
              const count = matching.length;
              const amount = matching.reduce((sum, o) => sum + o.total, 0);
              const pct =
                orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;

              return (
                <div key={status.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#0B0B0D]">
                      {status.label}{' '}
                      <span className="text-[#0B0B0D]/50 tabular-nums">
                        ({count})
                      </span>
                    </span>
                    <span className="font-semibold text-[#0B0B0D] tabular-nums">
                      {formatPKR(amount)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-black/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${status.barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Orders Table */}
        <section className="lg:col-span-7 bg-white border border-black/10 rounded-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-black/8 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[#0B0B0D]">
                Recent Orders
              </h2>
              <p className="text-xs text-[#0B0B0D]/55 mt-0.5">
                Latest guest orders submitted through checkout
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveAdminSection('orders')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0B0B0D] hover:underline cursor-pointer whitespace-nowrap"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-2">
              <p className="text-sm font-medium text-[#0B0B0D]">No orders yet</p>
              <p className="text-xs text-[#0B0B0D]/55 max-w-xs">
                When customers place Cash on Delivery orders, they appear here in real time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-black/8 text-[#0B0B0D]/55 uppercase tracking-[0.1em]">
                    <th className="py-3 px-5 font-medium">Order</th>
                    <th className="py-3 px-4 font-medium">Customer</th>
                    <th className="py-3 px-4 font-medium">City</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-5 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/6">
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => onSelectOrder(order)}
                      className="hover:bg-[#FAF8F9] transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-5 font-semibold text-[#0B0B0D] tabular-nums whitespace-nowrap">
                        {order.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 text-[#0B0B0D]">
                        {order.customerName}
                      </td>
                      <td className="py-3.5 px-4 text-[#0B0B0D]/65">
                        {order.city}
                      </td>
                      <td
                        className={`py-3.5 px-4 font-semibold capitalize ${
                          STATUS_BADGE_MAP[order.orderStatus]
                        }`}
                      >
                        {order.orderStatus}
                      </td>
                      <td className="py-3.5 px-5 text-right font-semibold text-[#0B0B0D] tabular-nums whitespace-nowrap">
                        {formatPKR(order.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
