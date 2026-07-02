import { useState } from "react";
import { Fragrance, Currency } from "../types";
import { X, ShoppingBag, ShieldCheck, Clock, Award } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatPrice } from "../utils/currency";

interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fragrance: Fragrance | null;
  onAddToBag: (fragrance: Fragrance, size: '50ml' | '100ml') => void;
  currency: Currency;
}

export default function QuickViewModal({
  isOpen,
  onClose,
  fragrance,
  onAddToBag,
  currency,
}: QuickViewModalProps) {
  const [selectedSize, setSelectedSize] = useState<'50ml' | '100ml'>("100ml");

  if (!fragrance) return null;

  const currentPrice = selectedSize === "50ml" ? Math.round(fragrance.price * 0.7) : fragrance.price;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-4xl glass-card text-on-surface rounded-xl overflow-hidden z-10 grid grid-cols-1 md:grid-cols-2 border border-white/10 shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 text-white/80 hover:text-white transition-colors border border-white/5 backdrop-blur-md"
            >
              <X size={18} />
            </button>

            {/* Left Column: Media & Visual */}
            <div className="relative h-64 md:h-full min-h-[350px] bg-black overflow-hidden flex items-center justify-center">
              <img
                src={fragrance.image}
                alt={fragrance.name}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover object-center opacity-90 transition-transform duration-[4s] hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#fed65b] font-medium block mb-1">
                  Aetheria Parfums — {fragrance.collection} Collection
                </span>
                <h3 className="text-xl md:text-2xl font-light tracking-wide text-white">
                  {fragrance.name}
                </h3>
              </div>
            </div>

            {/* Right Column: Details & Order Form */}
            <div className="p-8 md:p-10 flex flex-col justify-between max-h-[90vh] overflow-y-auto bg-black/25">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#e9c349] font-semibold block mb-2">
                  Extrait de Parfum
                </span>
                <h2 className="text-3xl font-light tracking-tight text-white mb-4">
                  {fragrance.name}
                </h2>

                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-2xl font-light text-white">{formatPrice(currentPrice, currency)}</span>
                  <span className="text-xs text-white/40 font-mono">{currency} / {selectedSize}</span>
                </div>

                <p className="text-sm leading-relaxed text-white/70 font-light mb-6">
                  {fragrance.detailedStory || fragrance.description}
                </p>

                {/* Fragrance Notes Breakdown */}
                <div className="mb-6 space-y-4">
                  <h4 className="text-[11px] uppercase tracking-[0.2em] text-[#c4c7c7] font-semibold">
                    The Olfactory Architecture
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/[0.03] border border-white/5 p-3 rounded-lg">
                      <span className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">Top</span>
                      <p className="text-[11px] text-white/80 font-medium leading-tight">
                        {fragrance.topNotes ? fragrance.topNotes.join(", ") : fragrance.notes[0]}
                      </p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 p-3 rounded-lg">
                      <span className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">Heart</span>
                      <p className="text-[11px] text-white/80 font-medium leading-tight">
                        {fragrance.heartNotes ? fragrance.heartNotes.join(", ") : fragrance.notes[1] || "Iris Absolu"}
                      </p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 p-3 rounded-lg">
                      <span className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">Base</span>
                      <p className="text-[11px] text-white/80 font-medium leading-tight">
                        {fragrance.baseNotes ? fragrance.baseNotes.join(", ") : fragrance.notes[2] || "Precious Musk"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sizing selection */}
                <div className="mb-8">
                  <label className="block text-[11px] uppercase tracking-[0.2em] text-white/50 font-semibold mb-3">
                    Select Flacon Volume
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setSelectedSize("50ml")}
                      className={`flex-1 py-3 text-center transition-all border ${
                        selectedSize === "50ml"
                          ? "border-white bg-white text-black font-semibold"
                          : "border-white/10 bg-transparent text-white hover:border-white/40"
                      } rounded-none font-mono text-xs`}
                    >
                      50ml Flacon — {formatPrice(Math.round(fragrance.price * 0.7), currency)}
                    </button>
                    <button
                      onClick={() => setSelectedSize("100ml")}
                      className={`flex-1 py-3 text-center transition-all border ${
                        selectedSize === "100ml"
                          ? "border-white bg-white text-black font-semibold"
                          : "border-white/10 bg-transparent text-white hover:border-white/40"
                      } rounded-none font-mono text-xs`}
                    >
                      100ml Flacon — {formatPrice(fragrance.price, currency)}
                    </button>
                  </div>
                </div>
              </div>

              {/* Add to Bag action */}
              <div className="space-y-4">
                <button
                  onClick={() => {
                    onAddToBag(fragrance, selectedSize);
                    onClose();
                  }}
                  className="w-full bg-white hover:bg-neutral-200 text-black py-4 font-mono uppercase tracking-[0.15em] text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300"
                >
                  <ShoppingBag size={15} />
                  Add to Shopping Bag
                </button>

                <div className="flex justify-around text-[10px] text-white/40 tracking-wider">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={11} className="text-[#fed65b]" />
                    Purity Sourced
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} className="text-[#fed65b]" />
                    12h+ Projection
                  </span>
                  <span className="flex items-center gap-1">
                    <Award size={11} className="text-[#fed65b]" />
                    Limited Batch
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
