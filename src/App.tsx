import React, { useState, useEffect } from "react";
import { FRAGRANCES } from "./data";
import { Fragrance, CartItem, OlfactoryPreference, CuratedScent, Currency } from "./types";
import ShaderBackground from "./components/ShaderBackground";
import QuickViewModal from "./components/QuickViewModal";
import CartSidebar from "./components/CartSidebar";
import CheckoutModal from "./components/CheckoutModal";
import { formatPrice } from "./utils/currency";
import { 
  ShoppingBag, 
  Search, 
  Leaf, 
  Sparkles, 
  Clock, 
  Award, 
  Compass, 
  Info, 
  ArrowRight,
  User,
  Mail,
  FlameKindling,
  ChevronRight,
  Undo
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Global Currency State
  const [currency, setCurrency] = useState<Currency>('USD');

  // Navigation & Search
  const [activeTab, setActiveTab] = useState<'collections' | 'philosophy' | 'finder'>('collections');
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Collection Filter state
  const [selectedCollection, setSelectedCollection] = useState<'All' | 'Homme' | 'Femme' | 'Universal' | 'Bespoke'>('All');

  // Shopping Bag state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Detail Modal state
  const [selectedFragrance, setSelectedFragrance] = useState<Fragrance | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // AI Finder state
  const [finderName, setFinderName] = useState("");
  const [finderEmail, setFinderEmail] = useState("");
  const [finderPreference, setFinderPreference] = useState<OlfactoryPreference>("Woody & Warm");
  const [isCurating, setIsCurating] = useState(false);
  const [curationProgress, setCurationProgress] = useState("");
  const [curatedResult, setCuratedResult] = useState<CuratedScent | null>(null);

  // Progress messages for AI curation
  const curationSteps = [
    "Contacting the House Vault...",
    "Analyzing your olfactory signature...",
    "Selecting hand-picked materials...",
    "Weaving top notes with precious heart resins...",
    "Balancing base molecules for intense projection...",
    "Securing bespoke allocation container..."
  ];

  useEffect(() => {
    if (isCurating) {
      let stepIndex = 0;
      setCurationProgress(curationSteps[0]);
      const interval = setInterval(() => {
        stepIndex++;
        if (stepIndex < curationSteps.length) {
          setCurationProgress(curationSteps[stepIndex]);
        }
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isCurating]);

  // Handlers
  const handleAddToBag = (fragrance: Fragrance, size: '50ml' | '100ml') => {
    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.fragrance.id === fragrance.id && item.size === size
      );
      if (existingIndex > -1) {
        const newItems = [...prevItems];
        newItems[existingIndex].quantity += 1;
        return newItems;
      }
      return [...prevItems, { fragrance, quantity: 1, size }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (id: string, size: '50ml' | '100ml', quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(id, size);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.fragrance.id === id && item.size === size ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveFromCart = (id: string, size: '50ml' | '100ml') => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => !(item.fragrance.id === id && item.size === size))
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleOpenQuickView = (fragrance: Fragrance) => {
    setSelectedFragrance(fragrance);
    setIsQuickViewOpen(true);
  };

  const handleScentCuratorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finderName.trim() || !finderEmail.trim()) {
      alert("Please provide both your name and email to request curatorship.");
      return;
    }

    setIsCurating(true);
    setCuratedResult(null);

    try {
      const response = await fetch("/api/curate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: finderName,
          email: finderEmail,
          preference: finderPreference,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to curate custom scent.");
      }

      const data = await response.json();
      setCuratedResult(data);
    } catch (err) {
      console.error(err);
      // Fallback handled nicely by the backend, but if even that fails, we can show a client-side backup
      setCuratedResult({
        name: "L'Heure Absolue",
        notes: ["Smoked Sandalwood", "White Amber Gris", "Bergamot Zest"],
        story: "A spontaneous manifestation of ultimate balance. Created specifically to enhance the majestic aura of your chosen archetype.",
        personality: "The quiet visionary who shapes reality with understated elegance.",
        wearScenario: "Sprayed onto bare collarbones before twilight walks.",
        price: 235
      });
    } finally {
      setIsCurating(false);
    }
  };

  const handleOrderCustomScent = () => {
    if (!curatedResult) return;
    
    // Construct a custom Fragrance item
    const customFragrance: Fragrance = {
      id: "bespoke-curated-" + Date.now(),
      name: `Bespoke: ${curatedResult.name}`,
      collection: 'Bespoke',
      notes: curatedResult.notes,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0d4c12BCy-2Oy4FIJ-HKntWYoIEOgSVfj_RqMlL9TqcEWiMS-VT-M4-LbcdDEv74kwlzvvScxBdSHdlicnBFirO2W5fhuARS2xHCl3O9CLYeIXodHuwTMC31jn6CH9a5wSTbITIF_i7L0V4_mAoWaYKekes8NYCDQ4HUENmzDGPW2ss6JA3AGYe12HLorcomV4_wX05np0IA8D8ixvrFrxE1emxVHggFAELIL_9IBwjJzbh3jGCVsYg',
      description: curatedResult.story,
      price: curatedResult.price,
      detailedStory: `${curatedResult.story} Specially made for ${finderName} (${curatedResult.personality}). Ideal wear context: ${curatedResult.wearScenario}.`,
      topNotes: [curatedResult.notes[0]],
      heartNotes: [curatedResult.notes[1]],
      baseNotes: [curatedResult.notes[2]]
    };

    handleAddToBag(customFragrance, "100ml");
  };

  const filteredFragrances = FRAGRANCES.filter((f) => {
    const matchesCollection = selectedCollection === "All" || f.collection === selectedCollection;
    const matchesSearch = searchQuery === "" || 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.notes.some((n) => n.toLowerCase().includes(searchQuery.toLowerCase())) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCollection && matchesSearch;
  });

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-[#0c0c0d] text-white min-h-screen font-sans antialiased overflow-x-hidden selection:bg-[#fed65b] selection:text-black">
      {/* WebGL ambient fluid shader */}
      <ShaderBackground />

      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-40 bg-black/60 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-12">
            <a href="#" className="font-light tracking-[0.25em] text-lg text-white hover:text-[#fed65b] transition-colors font-mono">
              AETHERIA
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8 text-xs font-mono tracking-widest uppercase text-white/60">
              <a 
                href="#collections" 
                onClick={() => setActiveTab('collections')}
                className={`hover:text-white transition-colors py-2 border-b-2 ${
                  activeTab === 'collections' ? 'border-[#fed65b] text-white' : 'border-transparent'
                }`}
              >
                Collections
              </a>
              <a 
                href="#philosophy" 
                onClick={() => setActiveTab('philosophy')}
                className={`hover:text-white transition-colors py-2 border-b-2 ${
                  activeTab === 'philosophy' ? 'border-[#fed65b] text-white' : 'border-transparent'
                }`}
              >
                Philosophy
              </a>
              <a 
                href="#finder" 
                onClick={() => setActiveTab('finder')}
                className={`hover:text-white transition-colors py-2 border-b-2 ${
                  activeTab === 'finder' ? 'border-[#fed65b] text-white' : 'border-transparent'
                }`}
              >
                The Finder
              </a>
            </div>
          </div>

          {/* Nav Controls */}
          <div className="flex items-center gap-6">
            {/* Inline search bar toggle */}
            <div className="relative flex items-center">
              <AnimatePresence>
                {isSearchVisible && (
                  <motion.input
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 180, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    type="text"
                    placeholder="Search scent..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white focus:outline-none focus:border-[#fed65b] font-mono mr-2"
                  />
                )}
              </AnimatePresence>
              <button 
                onClick={() => setIsSearchVisible(!isSearchVisible)}
                className="text-white/80 hover:text-white transition-colors p-1"
                aria-label="Toggle search"
              >
                <Search size={18} />
              </button>
            </div>

            {/* Currency Switcher */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1 text-[10px] font-mono">
              {(['USD', 'EUR', 'GBP'] as const).map((cur) => (
                <button
                  key={cur}
                  onClick={() => setCurrency(cur)}
                  className={`px-2.5 py-0.5 rounded-full transition-all duration-300 ${
                    currency === cur
                      ? 'bg-[#fed65b] text-black font-bold shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                  aria-label={`Switch to ${cur}`}
                >
                  {cur}
                </button>
              ))}
            </div>

            {/* Shopping bag button */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3.5 py-1.5 text-xs transition-all duration-300 group"
              aria-label="View shopping bag"
            >
              <ShoppingBag size={14} className="group-hover:text-[#fed65b] transition-colors" />
              <span className="font-mono">{totalCartCount}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-6 md:px-12 pt-28 pb-20 overflow-hidden">
        {/* Background image container */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            alt="Aetheria Luxury Perfume Bottle" 
            className="w-full h-full object-cover object-center opacity-40 mix-blend-luminosity scale-105 hover:scale-100 transition-transform duration-[6s] ease-out" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0d4c12BCy-2Oy4FIJ-HKntWYoIEOgSVfj_RqMlL9TqcEWiMS-VT-M4-LbcdDEv74kwlzvvScxBdSHdlicnBFirO2W5fhuARS2xHCl3O9CLYeIXodHuwTMC31jn6CH9a5wSTbITIF_i7L0V4_mAoWaYKekes8NYCDQ4HUENmzDGPW2ss6JA3AGYe12HLorcomV4_wX05np0IA8D8ixvrFrxE1emxVHggFAELIL_9IBwjJzbh3jGCVsYg"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0d] via-[#0c0c0d]/70 to-[#0c0c0d]/20" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16 mt-12">
          {/* Text block */}
          <div className="w-full lg:w-1/2 flex flex-col items-start gap-8">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#fed65b]">
              Bespoke Digital Olfaction
            </span>
            <h1 className="text-4xl md:text-6xl font-light tracking-tight text-white leading-[1.1] max-w-xl">
              The Architecture <br />of Emotion.
            </h1>
            <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-md font-light">
              A scent that lingers in the memory long after the moment has passed. Crafted with precision, aged in absolute silence, worn with deliberate intent.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a 
                href="#collections"
                className="bg-white hover:bg-neutral-200 text-black font-mono text-xs uppercase tracking-[0.15em] px-8 py-4 transition-all duration-300 font-semibold"
              >
                Discover Collection
              </a>
              <a 
                href="#finder"
                className="bg-transparent border border-white/20 text-white hover:border-[#fed65b] font-mono text-xs uppercase tracking-[0.15em] px-8 py-4 transition-all duration-300"
              >
                Launch Custom Finder
              </a>
            </div>
          </div>

          {/* Right Cards Showcase: Premium Qualities */}
          <div className="w-full lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-6 flex flex-col items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-md">
              <Leaf className="text-[#fed65b] w-6 h-6 stroke-1" />
              <h3 className="text-xs font-mono uppercase tracking-widest text-white">Premium Ingredients</h3>
              <p className="text-xs text-white/50 leading-relaxed font-light">
                Sourced from remote biological reserves globally for unparalleled purity.
              </p>
            </div>
            <div className="glass-card p-6 flex flex-col items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-md">
              <Clock className="text-[#fed65b] w-6 h-6 stroke-1" />
              <h3 className="text-xs font-mono uppercase tracking-widest text-white">Long-Lasting Aura</h3>
              <p className="text-xs text-white/50 leading-relaxed font-light">
                Concentrated at pure Extrait de Parfum density for continuous projection.
              </p>
            </div>
            <div className="glass-card p-6 flex flex-col items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-md">
              <Award className="text-[#fed65b] w-6 h-6 stroke-1" />
              <h3 className="text-xs font-mono uppercase tracking-widest text-white">Curated Artistry</h3>
              <p className="text-xs text-white/50 leading-relaxed font-light">
                Every release is hand-poured in small, numbered artisan batches.
              </p>
            </div>
            <div className="glass-card p-6 flex flex-col items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-md">
              <Sparkles className="text-[#fed65b] w-6 h-6 stroke-1" />
              <h3 className="text-xs font-mono uppercase tracking-widest text-white">Exclusive Releases</h3>
              <p className="text-xs text-white/50 leading-relaxed font-light">
                Enjoy complimentary shipping and access to private vault archives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section id="philosophy" className="py-24 px-6 md:px-12 bg-black/35 border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="text-[10px] font-mono uppercase tracking-[0.30em] text-[#e9c349]">
            Our Creed
          </span>
          <h2 className="text-3xl md:text-4xl font-light tracking-wide text-white">
            Ether &amp; Essence
          </h2>
          <div className="w-12 h-px bg-white/20 mx-auto" />
          <p className="text-white/70 text-sm md:text-lg leading-relaxed font-light max-w-2xl mx-auto">
            We believe fragrance is the ultimate invisible garment. It speaks before you speak, and lingers long after you leave. Aetheria is born from the creative tension between structural, sterile minimalism and overwhelming organic abundance. Made strictly for those who command the room in silence.
          </p>
        </div>
      </section>

      {/* Explorer / Collections Section */}
      <section id="collections" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#fed65b] block mb-2">
              The Olfactory Wardrobe
            </span>
            <h2 className="text-2xl md:text-3xl font-light tracking-wide">
              The Curated Collection
            </h2>
          </div>

          {/* Collection Filters */}
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {(['All', 'Homme', 'Femme', 'Universal', 'Bespoke'] as const).map((col) => (
              <button
                key={col}
                onClick={() => setSelectedCollection(col)}
                className={`px-4 py-2 border transition-all ${
                  selectedCollection === col
                    ? 'border-white bg-white text-black font-semibold'
                    : 'border-white/10 hover:border-white/30 text-white/60'
                }`}
              >
                {col === 'All' ? 'All Collections' : `${col} Collection`}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of Fragrances */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredFragrances.map((fragrance) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              key={fragrance.id}
              className="group glass-card border border-white/5 rounded-xl overflow-hidden bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-500 flex flex-col justify-between"
            >
              {/* Card Image */}
              <div className="relative h-72 w-full overflow-hidden bg-black/50">
                <img
                  src={fragrance.image}
                  alt={fragrance.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[4s] ease-out opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="bg-black/60 backdrop-blur-md text-[9px] font-mono uppercase tracking-widest px-3 py-1 text-white border border-white/10 rounded-full">
                    {fragrance.collection}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex flex-wrap gap-1">
                    {fragrance.notes.map((note) => (
                      <span
                        key={note}
                        className="bg-white/10 backdrop-blur-md text-white text-[9px] font-mono tracking-widest px-2.5 py-0.5 uppercase border border-white/5 rounded-full"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Details */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <h3 className="text-lg font-light tracking-wide text-white group-hover:text-[#fed65b] transition-colors">
                      {fragrance.name}
                    </h3>
                    <span className="text-sm font-mono text-[#fed65b] font-medium">{formatPrice(fragrance.price, currency)}</span>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed font-light">
                    {fragrance.description}
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleOpenQuickView(fragrance)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-all"
                  >
                    Quick View
                  </button>
                  <button
                    onClick={() => handleAddToBag(fragrance, "100ml")}
                    className="flex-1 bg-white hover:bg-neutral-200 text-black py-2.5 font-mono text-[10px] uppercase tracking-widest font-semibold transition-all"
                  >
                    Add to Bag
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredFragrances.length === 0 && (
          <div className="text-center py-20 opacity-55">
            <p className="font-light tracking-widest text-sm text-white/50">No scents matched your search criteria.</p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedCollection("All"); }}
              className="text-[#fed65b] font-mono text-xs uppercase tracking-wider mt-4 underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* The Finder (AI Curated custom Scent Section) */}
      <section id="finder" className="py-24 px-6 md:px-12 bg-black/20 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-8 md:p-16 border border-white/10 bg-white/[0.01] backdrop-blur-xl relative overflow-hidden">
            {/* Background absolute ornament */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#fed65b]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center max-w-xl mx-auto space-y-4 mb-12">
              <Compass className="mx-auto w-8 h-8 text-[#fed65b] stroke-1" />
              <h2 className="text-3xl font-light tracking-wide text-white">The Scent Finder</h2>
              <p className="text-xs md:text-sm text-white/50 leading-relaxed font-light">
                Embark on an AI-powered olfactory consultation. Our custom master perfumer model will synthesize your personal archetype to craft your ultimate bespoke signature formulation.
              </p>
            </div>

            {/* If curation result is present */}
            <AnimatePresence mode="wait">
              {curatedResult ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
                >
                  {/* Digital formulation bottle mockup */}
                  <div className="relative bg-[#0d0d0d] aspect-square rounded-xl border border-white/10 overflow-hidden flex flex-col justify-center items-center p-8 text-center group">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#fed65b]/5 via-transparent to-transparent opacity-60" />
                    {/* Bottle design wireframe */}
                    <div className="w-32 h-44 border border-white/25 rounded-md flex flex-col justify-between p-4 relative group-hover:border-[#fed65b]/50 transition-all duration-500 shadow-2xl">
                      {/* cap */}
                      <div className="w-12 h-10 border border-white/20 mx-auto -mt-10 bg-[#0d0d0d]" />
                      
                      {/* label */}
                      <div className="border border-white/10 p-2 font-mono text-[8px] bg-black/80 space-y-1">
                        <span className="block text-[#fed65b] tracking-[0.2em] font-bold">AETHERIA</span>
                        <span className="block text-white/80 tracking-widest font-semibold truncate uppercase">{curatedResult.name}</span>
                        <span className="block text-white/30 text-[6px]">100ml / Extrait de Parfum</span>
                      </div>

                      <div className="text-[7px] text-white/20 font-mono text-center">Formulation No. {Math.floor(Math.random() * 900) + 100}</div>
                    </div>

                    <div className="mt-8 space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#fed65b]">
                        Bespoke Formula
                      </span>
                      <h3 className="text-xl font-light text-white">{curatedResult.name}</h3>
                      <span className="text-xs text-white/40 font-mono block">{formatPrice(curatedResult.price, currency)} {currency}</span>
                    </div>
                  </div>

                  {/* Curation details narrative */}
                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#e9c349] block mb-1">
                        Olfactory Narrative
                      </span>
                      <p className="text-sm font-light text-white/80 leading-relaxed italic">
                        &ldquo;{curatedResult.story}&rdquo;
                      </p>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block">
                        Formulated Ingredients
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {curatedResult.notes.map((note) => (
                          <span
                            key={note}
                            className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-mono text-white/80 uppercase tracking-wider"
                          >
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 border-t border-white/5 pt-4">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block">
                        Wearer Archetype
                      </span>
                      <p className="text-xs text-white/60 font-light">
                        {curatedResult.personality}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block">
                        Recommended Context
                      </span>
                      <p className="text-xs text-white/60 font-light">
                        {curatedResult.wearScenario}
                      </p>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={handleOrderCustomScent}
                        className="flex-1 bg-white hover:bg-neutral-200 text-black py-3.5 font-mono text-xs uppercase tracking-widest font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        Order Custom Flacon
                        <ArrowRight size={13} />
                      </button>
                      <button
                        onClick={() => setCuratedResult(null)}
                        className="px-4 border border-white/10 hover:border-white/30 text-white/60 hover:text-white transition-all flex items-center justify-center"
                        title="Start over"
                      >
                        <Undo size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : isCurating ? (
                /* Loading State */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-16 text-center space-y-6 flex flex-col items-center justify-center"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.03]">
                      <Sparkles size={24} className="text-[#fed65b] animate-pulse" />
                    </div>
                    <div className="absolute -inset-1 border border-[#fed65b] rounded-full animate-ping opacity-25" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-mono text-white tracking-widest uppercase animate-pulse">
                      {curationProgress}
                    </p>
                    <p className="text-[10px] text-white/40 font-mono">
                      Formulating premium structural elements...
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* Question Form State */
                <motion.form
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleScentCuratorSubmit}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-white/40">
                        Your Name *
                      </label>
                      <div className="relative">
                        <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                          required
                          type="text"
                          value={finderName}
                          onChange={(e) => setFinderName(e.target.value)}
                          placeholder="Aurelia Vance"
                          className="w-full bg-white/[0.02] border border-white/10 focus:border-[#fed65b] focus:ring-0 pl-10 pr-4 py-3 text-sm text-white rounded-none transition-colors placeholder-white/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-white/40">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                          required
                          type="email"
                          value={finderEmail}
                          onChange={(e) => setFinderEmail(e.target.value)}
                          placeholder="aurelia@houseofvance.com"
                          className="w-full bg-white/[0.02] border border-white/10 focus:border-[#fed65b] focus:ring-0 pl-10 pr-4 py-3 text-sm text-white rounded-none transition-colors placeholder-white/20"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <label className="block text-[10px] font-mono uppercase tracking-[0.15em] text-white/50 text-center">
                      I gravitate towards...
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(['Woody & Warm', 'Fresh & Citrus', 'Floral & Airy', 'Dark & Spicy'] as const).map((pref) => (
                        <button
                          key={pref}
                          type="button"
                          onClick={() => setFinderPreference(pref)}
                          className={`p-4 border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                            finderPreference === pref
                              ? 'border-[#fed65b] bg-[#fed65b]/5 text-white font-semibold'
                              : 'border-white/10 hover:border-white/30 text-white/60 bg-transparent'
                          }`}
                        >
                          <FlameKindling size={16} className={finderPreference === pref ? 'text-[#fed65b]' : 'text-white/30'} />
                          <span className="text-[10px] font-mono tracking-wider uppercase">{pref}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 text-center">
                    <button
                      type="submit"
                      className="bg-white hover:bg-neutral-200 text-black font-mono text-xs uppercase tracking-[0.2em] px-12 py-4.5 transition-all duration-300 font-semibold w-full sm:w-auto"
                    >
                      Synthesize My Signature
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-black/90 text-white py-16 px-6 md:px-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand block */}
          <div className="space-y-4">
            <h4 className="font-light tracking-[0.25em] text-white text-lg font-mono">
              AETHERIA
            </h4>
            <p className="text-xs text-white/40 leading-relaxed max-w-xs font-light">
              Redefining the digital architecture of luxury emotion through meticulously curated signature scents.
            </p>
          </div>

          {/* Links 1 */}
          <div className="space-y-3 font-mono text-xs">
            <h5 className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Discover</h5>
            <ul className="space-y-2">
              <li><a href="#collections" className="text-white/60 hover:text-white transition-colors">Our Scent Wardrobe</a></li>
              <li><a href="#philosophy" className="text-white/60 hover:text-white transition-colors">Our Creed</a></li>
              <li><a href="#finder" className="text-white/60 hover:text-white transition-colors">Digital Curation</a></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div className="space-y-3 font-mono text-xs">
            <h5 className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Services</h5>
            <ul className="space-y-2">
              <li><span className="text-white/40 cursor-default">White-Glove Delivery</span></li>
              <li><span className="text-white/40 cursor-default">Planetary Allocations</span></li>
              <li><span className="text-white/40 cursor-default">Vault Privileges</span></li>
            </ul>
          </div>

          {/* Copyright/Registry details */}
          <div className="space-y-2 font-mono text-[10px] text-white/30 md:text-right">
            <p>&copy; {new Date().getFullYear()} AETHERIA PARFUMS. ALL RIGHTS RESERVED.</p>
            <p>CONV. CODE: 51d0cceb-e9e7-4ed6-aedf-8be81c85d4a6</p>
            <p>DESIGN: APPLE LUXURY MINIMALIST STYLING</p>
          </div>
        </div>
      </footer>

      {/* Dynamic Modals / Drawer Overlays */}
      <QuickViewModal
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        fragrance={selectedFragrance}
        onAddToBag={handleAddToBag}
        currency={currency}
      />

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemove={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        currency={currency}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        onClearCart={handleClearCart}
        currency={currency}
      />
    </div>
  );
}
