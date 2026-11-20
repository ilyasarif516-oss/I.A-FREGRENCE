import React, { useState } from 'react';
import {
  Check,
  Copy,
  Instagram,
  Mail,
  MessageCircle,
  Send,
  Settings2,
  Share2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { buildWhatsAppUrl, safeExternalHref } from '../utils/format';

export function ContactSection() {
  const { contactSettings, openAdmin, showToast } = useStore();
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');

  const handleCopyEmail = async () => {
    if (!contactSettings.email) return;
    try {
      await navigator.clipboard.writeText(contactSettings.email);
      setCopiedEmail(true);
      showToast('Email address copied to clipboard.');
      window.setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      showToast(contactSettings.email);
    }
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName.trim() || !inquiryMessage.trim()) return;
    const composed = `Hello I.A FRAGRANCE, my name is ${inquiryName.trim()}. ${inquiryMessage.trim()}`;
    const waUrl = buildWhatsAppUrl(contactSettings.whatsappNumber, composed);
    if (waUrl !== '#contact') {
      window.location.href = waUrl;
    } else if (contactSettings.email) {
      window.location.href = `mailto:${contactSettings.email}?subject=${encodeURIComponent(
        `Fragrance Inquiry from ${inquiryName.trim()}`
      )}&body=${encodeURIComponent(inquiryMessage.trim())}`;
    } else {
      showToast('Configure WhatsApp or Email in the Admin Panel first.');
    }
  };

  const socialLinks = [
    { label: 'Instagram', url: safeExternalHref(contactSettings.instagramUrl) },
    { label: 'Facebook', url: safeExternalHref(contactSettings.facebookUrl) },
    { label: 'TikTok', url: safeExternalHref(contactSettings.tiktokUrl) },
  ].filter((item): item is { label: string; url: string } => Boolean(item.url));

  return (
    <section id="contact" className="py-20 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Configurable Contact Channels */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 space-y-8"
          >
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[#0B0B0D]/55">
                Private Concierge
              </p>
              <h2
                className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#0B0B0D]"
                style={{ textWrap: 'balance' }}
              >
                Connect With Our Studio
              </h2>
              <p className="text-base text-[#0B0B0D]/70 leading-relaxed max-w-lg">
                Reach out for scent recommendations, bulk gifting orders, or delivery
                assistance. All contact channels below are live-configurable from the Admin Panel.
              </p>
            </div>

            <div className="divide-y divide-black/10 border-t border-b border-black/10">
              {/* WhatsApp */}
              <div className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#FDF5F8] border border-[#F4CBD8] flex items-center justify-center shrink-0 text-[#0B0B0D]">
                    <MessageCircle className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[#0B0B0D]/55">
                      WhatsApp Concierge
                    </p>
                    <p className="text-base font-medium text-[#0B0B0D] tabular-nums mt-0.5">
                      {contactSettings.whatsappNumber || 'Not configured'}
                    </p>
                  </div>
                </div>
                {contactSettings.whatsappNumber && (
                  <a
                    href={buildWhatsAppUrl(
                      contactSettings.whatsappNumber,
                      'Hello I.A FRAGRANCE, I would like to inquire about your signature scents.'
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#0B0B0D] text-white text-xs font-medium hover:bg-[#222228] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
                  >
                    <span>Message on WhatsApp</span>
                  </a>
                )}
              </div>

              {/* Email */}
              <div className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#FDF5F8] border border-[#F4CBD8] flex items-center justify-center shrink-0 text-[#0B0B0D]">
                    <Mail className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[#0B0B0D]/55">
                      Email Address
                    </p>
                    <a
                      href={contactSettings.email ? `mailto:${contactSettings.email}` : '#contact'}
                      className="text-base font-medium text-[#0B0B0D] hover:underline mt-0.5 inline-block break-all"
                    >
                      {contactSettings.email || 'Not configured'}
                    </a>
                  </div>
                </div>
                {contactSettings.email && (
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full border border-black/15 text-xs font-medium text-[#0B0B0D] hover:border-black transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[40px]"
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="w-3.5 h-3.5" strokeWidth={2} />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>Copy Email</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Social Media Links */}
              <div className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#FDF5F8] border border-[#F4CBD8] flex items-center justify-center shrink-0 text-[#0B0B0D]">
                    <Share2 className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[#0B0B0D]/55">
                      Social Channels
                    </p>
                    <p className="text-sm text-[#0B0B0D]/70 mt-0.5">
                      {contactSettings.atelierCity} · {contactSettings.conciergeHours}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {socialLinks.length > 0 ? (
                    socialLinks.map((social) => (
                      <a
                        key={social.label}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-black/15 text-xs font-medium text-[#0B0B0D] hover:bg-[#0B0B0D] hover:text-white transition-colors whitespace-nowrap min-h-[38px]"
                      >
                        {social.label === 'Instagram' && (
                          <Instagram className="w-3.5 h-3.5" strokeWidth={1.75} />
                        )}
                        <span>{social.label}</span>
                      </a>
                    ))
                  ) : (
                    <span className="text-xs text-[#0B0B0D]/50">No social links set</span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openAdmin('settings')}
              className="inline-flex items-center gap-2 text-xs font-medium text-[#0B0B0D]/65 hover:text-[#0B0B0D] underline underline-offset-4 transition-colors cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Edit WhatsApp, Email & Social Links in Admin Dashboard</span>
            </button>
          </motion.div>

          {/* Right Column: Direct Concierge Message Box */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 rounded-2xl bg-[#FDF5F8] border border-[#F4CBD8] p-7 sm:p-10 space-y-6"
          >
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-[#0B0B0D]/60">
                Direct Inquiry
              </p>
              <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[#0B0B0D]">
                Send a Note to I.A FRAGRANCE
              </h3>
            </div>

            <form onSubmit={handleInquirySubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="inquiry-name"
                  className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/70"
                >
                  Your Name
                </label>
                <input
                  id="inquiry-name"
                  type="text"
                  required
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-black/15 text-sm text-[#0B0B0D] placeholder:text-[#0B0B0D]/40 focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="inquiry-message"
                  className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/70"
                >
                  Message or Fragrance Request
                </label>
                <textarea
                  id="inquiry-message"
                  rows={4}
                  required
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  placeholder="Ask about Pink Lattafa, gift wrapping, or delivery details..."
                  className="w-full px-4 py-3 rounded-xl bg-white border border-black/15 text-sm text-[#0B0B0D] placeholder:text-[#0B0B0D]/40 focus:outline-none focus:ring-2 focus:ring-[#0B0B0D] resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-[#0B0B0D] text-white text-sm font-medium hover:bg-[#222228] transition-colors cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0D]"
              >
                <Send className="w-4 h-4 text-[#F4CBD8]" strokeWidth={1.75} />
                <span>Send via WhatsApp Concierge</span>
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
