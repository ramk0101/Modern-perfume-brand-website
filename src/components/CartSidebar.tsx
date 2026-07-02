import { CartItem, Currency } from "../types";
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatPrice } from "../utils/currency";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemove: (id: string, size: '50ml' | '100ml') => void;
  onUpdateQuantity: (id: string, size: '50ml' | '100ml', quantity: number) => void;
  onCheckout: () => void;
  currency: Currency;
}

export default function CartSidebar({
  isOpen,
  onClose,
  cartItems,
  onRemove,
  onUpdateQuantity,
  onCheckout,
  currency,
}: CartSidebarProps) {
  const getPrice = (item: CartItem) => {
    const base = item.fragrance.price;
    return item.size === "50ml" ? Math.round(base * 0.7) : base;
  };

  const getSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + getPrice(item) * item.quantity, 0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-screen max-w-md glass-card border-l border-white/10 text-white flex flex-col h-full shadow-2xl relative z-10"
            >
              {/* Header */}
              <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} className="text-[#fed65b]" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.2em] font-mono">
                    Your Shopping Bag ({cartItems.reduce((sum, i) => sum + i.quantity, 0)})
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full text-white/50 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto py-6 px-6 space-y-6">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-55 py-20">
                    <ShoppingBag size={48} className="stroke-1 mb-4 text-white/40" />
                    <p className="font-light text-sm tracking-wider mb-2">Your bag is empty.</p>
                    <p className="text-xs text-white/40">Select a signature scent to begin your olfactory journey.</p>
                  </div>
                ) : (
                  cartItems.map((item, index) => {
                    const price = getPrice(item);
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={`${item.fragrance.id}-${item.size}`}
                        className="flex gap-4 pb-6 border-b border-white/5 items-start"
                      >
                        {/* Thumbnail */}
                        <div className="w-20 h-24 bg-black rounded-lg overflow-hidden border border-white/5 flex-shrink-0 relative">
                          <img
                            src={item.fragrance.image}
                            alt={item.fragrance.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-between h-full min-h-[96px]">
                          <div>
                            <span className="text-[9px] uppercase tracking-widest text-[#e9c349] block mb-1">
                              {item.fragrance.collection}
                            </span>
                            <h3 className="text-sm font-medium tracking-wide text-white">
                              {item.fragrance.name}
                            </h3>
                            <span className="text-[10px] font-mono text-white/40 uppercase block mt-0.5">
                              Size: {item.size}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            {/* Quantity buttons */}
                            <div className="flex items-center border border-white/10 rounded-full overflow-hidden bg-white/[0.03]">
                              <button
                                onClick={() => onUpdateQuantity(item.fragrance.id, item.size, item.quantity - 1)}
                                className="p-1 px-2.5 text-white/40 hover:text-white hover:bg-white/5 transition-all"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="text-xs px-2 font-mono text-white/80 select-none">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => onUpdateQuantity(item.fragrance.id, item.size, item.quantity + 1)}
                                className="p-1 px-2.5 text-white/40 hover:text-white hover:bg-white/5 transition-all"
                              >
                                <Plus size={10} />
                              </button>
                            </div>

                            {/* Price / Delete */}
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-light text-white font-mono">
                                {formatPrice(price * item.quantity, currency)}
                              </span>
                              <button
                                onClick={() => onRemove(item.fragrance.id, item.size)}
                                className="text-white/30 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Footer Summary */}
              {cartItems.length > 0 && (
                <div className="px-6 py-6 border-t border-white/10 bg-black/45 space-y-6">
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-xs text-white/60 font-mono">
                      <span>Complimentary Shipping</span>
                      <span className="text-white uppercase">Free</span>
                    </div>
                    <div className="flex justify-between text-xs text-white/60 font-mono">
                      <span>Sustainable Packaging</span>
                      <span className="text-white uppercase">Included</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t border-white/5">
                      <span className="text-sm font-light tracking-wider">Subtotal</span>
                      <span className="text-2xl font-light text-white font-mono">{formatPrice(getSubtotal(), currency)}</span>
                    </div>
                  </div>

                  <button
                    onClick={onCheckout}
                    className="w-full bg-[#fed65b] hover:bg-[#ffe088] text-black py-4 font-mono uppercase tracking-[0.2em] text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-yellow-500/10"
                  >
                    Proceed to Checkout
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
