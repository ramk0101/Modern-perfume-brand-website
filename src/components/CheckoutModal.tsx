import React, { useState } from "react";
import { CartItem, Currency } from "../types";
import { X, Check, ArrowRight, Sparkles, CreditCard, Landmark, Truck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatPrice } from "../utils/currency";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onClearCart: () => void;
  currency: Currency;
  onCheckoutSuccess?: (details: { name: string; email: string; address: string }) => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  onClearCart,
  currency,
  onCheckoutSuccess,
}: CheckoutModalProps) {
  const [step, setStep] = useState<'details' | 'success'>('details');
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    zip: "",
    cardNumber: "4111 2222 3333 4444",
    cardExpiry: "12/28",
    cardCvc: "999",
  });

  const getPrice = (item: CartItem) => {
    const base = item.fragrance.price;
    return item.size === "50ml" ? Math.round(base * 0.7) : base;
  };

  const getSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + getPrice(item) * item.quantity, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.address) {
      alert("Please enter all required shipping details.");
      return;
    }
    if (onCheckoutSuccess) {
      onCheckoutSuccess({
        name: formData.name,
        email: formData.email,
        address: `${formData.address}, ${formData.city} ${formData.zip}`
      });
    }
    setStep('success');
  };

  const handleSuccessClose = () => {
    onClearCart();
    setStep('details');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={step === 'details' ? onClose : undefined}
            className="fixed inset-0 bg-black/90 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-4xl glass-card text-white rounded-xl overflow-hidden z-10 border border-white/10 shadow-2xl bg-[#0d0d0d]/90"
          >
            {/* Close Button */}
            {step === 'details' && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 p-2 rounded-full text-white/50 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            )}

            {step === 'details' ? (
              <div className="grid grid-cols-1 md:grid-cols-12 max-h-[85vh] overflow-y-auto">
                {/* Form column */}
                <div className="p-8 md:p-12 md:col-span-7 border-r border-white/5">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#e9c349] font-semibold block mb-2">
                    Secured Transaction
                  </span>
                  <h2 className="text-2xl font-light tracking-tight text-white mb-8">
                    Checkout Registry
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Contact details */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-mono uppercase tracking-widest text-white/50">
                        1. Client Address
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5 font-semibold">
                            Full Name *
                          </label>
                          <input
                            required
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Aurelia Vance"
                            className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] focus:ring-0 px-4 py-3 text-sm text-white rounded-none transition-colors placeholder-white/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5 font-semibold">
                            Email Address *
                          </label>
                          <input
                            required
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="aurelia@houseofvance.com"
                            className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] focus:ring-0 px-4 py-3 text-sm text-white rounded-none transition-colors placeholder-white/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5 font-semibold">
                          Delivery Destination *
                        </label>
                        <input
                          required
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="840 Fifth Avenue, Apt 4B"
                          className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] focus:ring-0 px-4 py-3 text-sm text-white rounded-none transition-colors placeholder-white/20"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5 font-semibold">
                            City *
                          </label>
                          <input
                            required
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder="New York"
                            className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] focus:ring-0 px-4 py-3 text-sm text-white rounded-none transition-colors placeholder-white/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5 font-semibold">
                            Postal Zip Code *
                          </label>
                          <input
                            required
                            type="text"
                            name="zip"
                            value={formData.zip}
                            onChange={handleInputChange}
                            placeholder="10021"
                            className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] focus:ring-0 px-4 py-3 text-sm text-white rounded-none transition-colors placeholder-white/20"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-mono uppercase tracking-widest text-white/50">
                          2. Vault Payment
                        </h3>
                        <div className="flex gap-2">
                          <CreditCard size={14} className="text-white/40" />
                          <Landmark size={14} className="text-white/40" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5 font-semibold">
                          Card Number (Simulated)
                        </label>
                        <input
                          type="text"
                          name="cardNumber"
                          value={formData.cardNumber}
                          onChange={handleInputChange}
                          className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] focus:ring-0 px-4 py-3 text-sm text-white rounded-none transition-colors font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5 font-semibold">
                            Expiration Date
                          </label>
                          <input
                            type="text"
                            name="cardExpiry"
                            value={formData.cardExpiry}
                            onChange={handleInputChange}
                            className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] focus:ring-0 px-4 py-3 text-sm text-white rounded-none transition-colors font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5 font-semibold">
                            Security Code (CVC)
                          </label>
                          <input
                            type="password"
                            name="cardCvc"
                            value={formData.cardCvc}
                            onChange={handleInputChange}
                            className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] focus:ring-0 px-4 py-3 text-sm text-white rounded-none transition-colors font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#fed65b] hover:bg-[#ffe088] text-black py-4 font-mono uppercase tracking-[0.2em] text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-xl shadow-yellow-500/10 mt-8"
                    >
                      Authenticate and Place Order
                      <ArrowRight size={13} />
                    </button>
                  </form>
                </div>

                {/* Items/Summary Column */}
                <div className="p-8 md:p-12 md:col-span-5 bg-white/[0.02] flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-widest text-white/50 mb-6">
                      Manifest Order
                    </h3>

                    <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 mb-6">
                      {cartItems.map((item) => {
                        const price = getPrice(item);
                        return (
                          <div key={`${item.fragrance.id}-${item.size}`} className="flex gap-4 items-center">
                            <div className="w-12 h-14 bg-black rounded border border-white/10 overflow-hidden flex-shrink-0">
                              <img
                                src={item.fragrance.image}
                                alt={item.fragrance.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white truncate">{item.fragrance.name}</p>
                              <p className="text-[10px] text-white/40 font-mono">
                                {item.size} × {item.quantity}
                              </p>
                            </div>
                            <span className="text-xs font-mono text-white/70">{formatPrice(price * item.quantity, currency)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-6 space-y-4">
                    <div className="flex justify-between text-xs text-white/40 font-mono">
                      <span>Subtotal</span>
                      <span>{formatPrice(getSubtotal(), currency)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-white/40 font-mono">
                      <span>Complimentary Shipping</span>
                      <span className="text-[#fed65b] uppercase">Free</span>
                    </div>
                    <div className="flex justify-between text-sm pt-3 border-t border-white/5 items-baseline">
                      <span className="font-light">Total Allocation</span>
                      <span className="text-xl font-light text-white font-mono">{formatPrice(getSubtotal(), currency)}</span>
                    </div>

                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-lg flex items-start gap-3 mt-4">
                      <Truck size={14} className="text-[#fed65b] mt-0.5 flex-shrink-0" />
                      <div className="space-y-0.5">
                        <h4 className="text-[11px] font-semibold tracking-wide text-white">White-Glove Courier Service</h4>
                        <p className="text-[10px] text-white/40 leading-relaxed">
                          Your bespoke parcel will arrive in temperature-controlled sustainable charcoal casing.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Success state */
              <div className="p-12 md:p-20 text-center flex flex-col items-center justify-center space-y-8">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.03] scale-110">
                    <Check size={36} className="text-[#fed65b]" />
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                    className="absolute -inset-2 border border-dashed border-white/10 rounded-full"
                  />
                </div>

                <div className="space-y-3 max-w-md mx-auto">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#e9c349] font-semibold block">
                    Allocation Authenticated
                  </span>
                  <h2 className="text-3xl font-light tracking-tight text-white">
                    Order Registered Successfully
                  </h2>
                  <p className="text-sm text-white/60 leading-relaxed font-light">
                    An elegant confirmation email has been dispatched to <span className="text-white font-medium">{formData.email}</span>. Your bespoke scent is now being hand-filled in our temperature-controlled vault.
                  </p>
                </div>

                {/* Simulated tracking sequence details */}
                <div className="bg-white/[0.02] border border-white/5 p-6 rounded-xl max-w-lg w-full text-left grid grid-cols-2 gap-6 font-mono text-xs text-white/70">
                  <div>
                    <span className="text-[9px] text-white/30 block uppercase tracking-wider mb-0.5">Shipment Courier</span>
                    <span className="text-[#fed65b] flex items-center gap-1.5">
                      <Sparkles size={11} />
                      Premium White-Glove
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/30 block uppercase tracking-wider mb-0.5">Tracking Number</span>
                    <span>AE-9821-001X</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/30 block uppercase tracking-wider mb-0.5">Client</span>
                    <span className="truncate block">{formData.name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/30 block uppercase tracking-wider mb-0.5">Destination</span>
                    <span className="truncate block">{formData.city}, {formData.zip}</span>
                  </div>
                </div>

                <button
                  onClick={handleSuccessClose}
                  className="bg-white hover:bg-neutral-200 text-black px-12 py-4 font-mono uppercase tracking-[0.2em] text-xs font-semibold transition-all duration-300"
                >
                  Return to Collection
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
