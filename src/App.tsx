import React, { useState, useEffect } from "react";
import { FRAGRANCES } from "./data";
import { Fragrance, CartItem, OlfactoryPreference, CuratedScent, Currency } from "./types";
import ShaderBackground from "./components/ShaderBackground";
import QuickViewModal from "./components/QuickViewModal";
import CartSidebar from "./components/CartSidebar";
import CheckoutModal from "./components/CheckoutModal";
import AuthModal from "./components/AuthModal";
import { formatPrice } from "./utils/currency";
import { 
  auth,
  initAuth, 
  googleSignIn, 
  googleSignOut,
  getAccessToken
} from "./utils/firebaseAuth";
import { onAuthStateChanged } from "firebase/auth";
import { 
  findLedgerSpreadsheet, 
  createLedgerSpreadsheet, 
  appendOrders, 
  appendFormula, 
  fetchSheetRows 
} from "./utils/googleSheets";
import { 
  saveOrderToFirestore, 
  saveFormulaToFirestore,
  fetchOrdersFromFirestore,
  fetchFormulasFromFirestore
} from "./utils/firestoreService";
import { User as FirebaseUser } from "firebase/auth";
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
  Undo,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  LogOut,
  Lock,
  Database,
  Layers,
  Table,
  CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import OwnerDashboard from "./components/OwnerDashboard";
import { fetchProductsFromFirestore } from "./utils/firestoreService";

export default function App() {
  // Global Currency State
  const [currency, setCurrency] = useState<Currency>('USD');

  // Navigation & Search
  const [activeTab, setActiveTab] = useState<'collections' | 'philosophy' | 'finder' | 'ledger' | 'dashboard'>('collections');

  // Dynamic Scent Catalog State
  const [fragrances, setFragrances] = useState<Fragrance[]>(FRAGRANCES);

  // Load dynamic catalog from Firestore
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const dbProducts = await fetchProductsFromFirestore();
        if (dbProducts && dbProducts.length > 0) {
          setFragrances(dbProducts);
        }
      } catch (err) {
        console.error("Failed to load products from Firestore", err);
      }
    };
    loadCatalog();
  }, [activeTab]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Google Sheets & Authentication State
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [isSheetsLoading, setIsSheetsLoading] = useState(false);
  const [sheetOrders, setSheetOrders] = useState<string[][]>([]);
  const [sheetFormulas, setSheetFormulas] = useState<string[][]>([]);
  const [sheetsError, setSheetsError] = useState<string | null>(null);
  const [activeLedgerSubTab, setActiveLedgerSubTab] = useState<'orders' | 'formulas'>('orders');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [firestoreOrders, setFirestoreOrders] = useState<any[]>([]);
  const [firestoreFormulas, setFirestoreFormulas] = useState<any[]>([]);

  const isAdmin = !!(googleUser && googleUser.email && (
    googleUser.email.toLowerCase() === 'shreeramk0101@gmail.com' || 
    googleUser.email.toLowerCase().endsWith('@aetheria.com')
  ));

  useEffect(() => {
    if (activeTab === 'dashboard' && !isAdmin) {
      setActiveTab('collections');
    }
  }, [activeTab, isAdmin]);

  const loadFirestoreLedger = async (uid: string) => {
    setIsSheetsLoading(true);
    try {
      const [formulas, orders] = await Promise.all([
        fetchFormulasFromFirestore(uid),
        fetchOrdersFromFirestore(uid)
      ]);
      setFirestoreFormulas(formulas);
      setFirestoreOrders(orders);
    } catch (err) {
      console.error("Failed to fetch Firestore ledger data:", err);
    } finally {
      setIsSheetsLoading(false);
    }
  };

  useEffect(() => {
    // Listen to standard Firebase auth changes (supports both Email/Password & Google SSO sessions)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setGoogleUser(user);
      const token = getAccessToken();
      if (user) {
        loadFirestoreLedger(user.uid);
        if (token) {
          setGoogleToken(token);
          await handleLoadSpreadsheet(token);
        } else {
          setGoogleToken(null);
          setSpreadsheetId(null);
        }
      } else {
        setGoogleToken(null);
        setSpreadsheetId(null);
        setFirestoreOrders([]);
        setFirestoreFormulas([]);
      }
    });
    return () => unsubscribe();
  }, []);

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

  const filteredFragrances = fragrances.filter((f) => {
    const matchesCollection = selectedCollection === "All" || f.collection === selectedCollection;
    const matchesSearch = searchQuery === "" || 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.notes.some((n) => n.toLowerCase().includes(searchQuery.toLowerCase())) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCollection && matchesSearch;
  });

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const ordersToDisplay = (spreadsheetId && sheetOrders.length > 0)
    ? sheetOrders
    : firestoreOrders.map(o => [
        o.orderId,
        o.date,
        o.type,
        o.productName,
        o.size,
        o.quantity,
        o.pricePaid,
        o.currency,
        o.status,
        o.customerName,
        o.address
      ]);

  const formulasToDisplay = (spreadsheetId && sheetFormulas.length > 0)
    ? sheetFormulas
    : firestoreFormulas.map(f => [
        f.name,
        f.date,
        f.description,
        f.vibe,
        f.intensity,
        f.topNotes,
        f.heartNotes,
        f.baseNotes,
        f.matchScore
      ]);

  // Google Sheets Action Handlers
  const handleLoadSpreadsheet = async (token: string) => {
    setIsSheetsLoading(true);
    setSheetsError(null);
    try {
      const existingId = await findLedgerSpreadsheet(token);
      if (existingId) {
        setSpreadsheetId(existingId);
        await fetchLedgerData(token, existingId);
      } else {
        setSpreadsheetId(null);
      }
    } catch (err) {
      console.error(err);
      setSheetsError("Failed to find or load spreadsheet from Google Drive.");
    } finally {
      setIsSheetsLoading(false);
    }
  };

  const fetchLedgerData = async (token: string, sheetId: string) => {
    setIsSheetsLoading(true);
    setSheetsError(null);
    try {
      const orders = await fetchSheetRows(token, sheetId, 'Orders');
      const formulas = await fetchSheetRows(token, sheetId, 'Custom%20Formulas');
      setSheetOrders(orders);
      setSheetFormulas(formulas);
    } catch (err) {
      console.error(err);
      setSheetsError("Failed to fetch ledger rows from Google Sheets.");
    } finally {
      setIsSheetsLoading(false);
    }
  };

  const handleInitializeSpreadsheet = async () => {
    if (!googleToken) return;
    setIsSheetsLoading(true);
    setSheetsError(null);
    try {
      const newId = await createLedgerSpreadsheet(googleToken);
      setSpreadsheetId(newId);
      await fetchLedgerData(googleToken, newId);
    } catch (err: any) {
      console.error(err);
      setSheetsError(`Failed to initialize spreadsheet: ${err.message || err}`);
    } finally {
      setIsSheetsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSheetsError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        await handleLoadSpreadsheet(result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setSheetsError(`Authentication failed: ${err.message || err}`);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await googleSignOut();
      setGoogleUser(null);
      setGoogleToken(null);
      setSpreadsheetId(null);
      setSheetOrders([]);
      setSheetFormulas([]);
    } catch (err) {
      console.error(err);
    }
  };

  const exportToCSV = (type: 'orders' | 'formulas') => {
    let csvContent = "";
    if (type === 'orders') {
      const headers = ["Order ID", "Date", "Type", "Product Name", "Size", "Quantity", "Price Paid", "Currency", "Status", "Customer Name", "Address"];
      csvContent += headers.join(",") + "\n";
      
      const rows = spreadsheetId && sheetOrders.length > 0 
        ? sheetOrders 
        : firestoreOrders.map(o => [
            o.orderId, o.date, o.type, o.productName, o.size, o.quantity, o.pricePaid, o.currency, o.status, o.customerName || "", o.address || ""
          ]);
          
      rows.forEach(row => {
        const cleanRow = row.map(val => {
          const str = String(val ?? "").replace(/"/g, '""');
          return str.includes(",") || str.includes("\n") ? `"${str}"` : str;
        });
        csvContent += cleanRow.join(",") + "\n";
      });
    } else {
      const headers = ["Formula Name", "Date Curated", "Description", "Vibe", "Intensity", "Top Notes", "Heart Notes", "Base Notes", "Match Score"];
      csvContent += headers.join(",") + "\n";
      
      const rows = spreadsheetId && sheetFormulas.length > 0 
        ? sheetFormulas 
        : firestoreFormulas.map(f => [
            f.name, f.date, f.description, f.vibe, f.intensity, f.topNotes, f.heartNotes, f.baseNotes, f.matchScore
          ]);
          
      rows.forEach(row => {
        const cleanRow = row.map(val => {
          const str = String(val ?? "").replace(/"/g, '""');
          return str.includes(",") || str.includes("\n") ? `"${str}"` : str;
        });
        csvContent += cleanRow.join(",") + "\n";
      });
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `aetheria_parfums_${type}_ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCheckoutSuccess = async (customerDetails: { name: string; email: string; address: string }) => {
    try {
      const orderRows = cartItems.map(item => {
        const basePrice = item.fragrance.price;
        const priceVal = item.size === "50ml" ? Math.round(basePrice * 0.7) : basePrice;
        return {
          orderId: "AETH-" + Math.floor(Math.random() * 900000 + 100000),
          userId: googleUser ? googleUser.uid : "anonymous",
          date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
          type: item.fragrance.collection === 'Bespoke' ? 'Custom' : 'Standard',
          productName: item.fragrance.name,
          size: item.size,
          quantity: item.quantity,
          pricePaid: formatPrice(priceVal * item.quantity, currency),
          currency: currency,
          status: 'Confirmed',
          customerName: customerDetails.name,
          address: customerDetails.address
        };
      });

      // 1. Save to Firestore if user is authenticated
      if (googleUser) {
        for (const order of orderRows) {
          await saveOrderToFirestore(order);
        }
        console.log("Logged orders to Firestore.");
        await loadFirestoreLedger(googleUser.uid);
      }

      // 2. Save to Google Sheets if spreadsheet is active
      if (googleToken && spreadsheetId) {
        await appendOrders(googleToken, spreadsheetId, orderRows);
        console.log("Logged orders to Google Sheets.");
        await fetchLedgerData(googleToken, spreadsheetId);
      }
    } catch (err) {
      console.error("Failed to log orders:", err);
    }
  };

  const handleSyncCustomFormula = async () => {
    if (!curatedResult) return;
    if (!googleUser) {
      setIsAuthOpen(true);
      alert("Please sign in or create an account to save this custom formula to your Atelier collection.");
      return;
    }

    const formulaId = "FORM-" + Math.floor(Math.random() * 900000 + 100000);
    const formulaPayload = {
      formulaId,
      userId: googleUser.uid,
      name: curatedResult.name,
      date: new Date().toLocaleDateString(),
      description: curatedResult.story,
      vibe: curatedResult.personality,
      intensity: "Extrait de Parfum (25%)",
      topNotes: curatedResult.notes[0] || "",
      heartNotes: curatedResult.notes[1] || "",
      baseNotes: curatedResult.notes[2] || "",
      matchScore: "98%"
    };

    try {
      setIsSyncing(true);
      
      // 1. Sync to Firestore
      await saveFormulaToFirestore(formulaPayload);
      if (googleUser) {
        await loadFirestoreLedger(googleUser.uid);
      }

      // 2. Sync to Google Sheets if connected
      if (googleToken && spreadsheetId) {
        const sheetsRow = {
          name: formulaPayload.name,
          date: formulaPayload.date,
          description: formulaPayload.description,
          vibe: formulaPayload.vibe,
          intensity: formulaPayload.intensity,
          topNotes: formulaPayload.topNotes,
          heartNotes: formulaPayload.heartNotes,
          baseNotes: formulaPayload.baseNotes,
          matchScore: formulaPayload.matchScore
        };
        await appendFormula(googleToken, spreadsheetId, sheetsRow);
        await fetchLedgerData(googleToken, spreadsheetId);
        alert(`Successfully saved formulation "${curatedResult.name}" to your Atelier Profile and Google Sheets Ledger!`);
      } else {
        alert(`Successfully saved formulation "${curatedResult.name}" to your Atelier Profile collection!`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save custom formulation.");
    } finally {
      setIsSyncing(false);
    }
  };

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
              <a 
                href="#ledger" 
                onClick={() => setActiveTab('ledger')}
                className={`hover:text-white transition-colors py-2 border-b-2 ${
                  activeTab === 'ledger' ? 'border-[#fed65b] text-white' : 'border-transparent'
                }`}
              >
                Sheets Ledger
              </a>
              {isAdmin && (
                <a 
                  href="#dashboard" 
                  onClick={() => setActiveTab('dashboard')}
                  className={`hover:text-white text-[#fed65b] transition-colors py-2 border-b-2 font-medium flex items-center gap-1 ${
                    activeTab === 'dashboard' ? 'border-[#fed65b]' : 'border-transparent'
                  }`}
                >
                  <Sparkles size={11} className="animate-pulse" />
                  Atelier Dashboard
                </a>
              )}
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
              {(['USD', 'INR'] as const).map((cur) => (
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

            {/* Profile / Atelier Lounge button */}
            <button 
              onClick={() => setIsAuthOpen(true)}
              className={`relative flex items-center justify-center p-2 rounded-full border transition-all duration-300 ${
                googleUser 
                  ? 'bg-[#fed65b]/5 border-[#fed65b]/30 text-[#fed65b] hover:border-[#fed65b]' 
                  : 'bg-white/5 border-white/10 hover:border-white/30 text-white hover:text-[#fed65b]'
              }`}
              title="Atelier Lounge"
              aria-label="Open Atelier Lounge Profile"
            >
              <User size={14} />
              {googleUser && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-black shadow-sm animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </nav>

      <div style={{ display: (activeTab === 'ledger' || activeTab === 'dashboard') ? 'none' : 'block' }}>

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

                     <div className="flex gap-4 pt-4 flex-wrap">
                      <button
                        onClick={handleOrderCustomScent}
                        className="flex-1 min-w-[150px] bg-white hover:bg-neutral-200 text-black py-3.5 font-mono text-xs uppercase tracking-widest font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        Order Custom Flacon
                        <ArrowRight size={13} />
                      </button>
                      <button
                        onClick={handleSyncCustomFormula}
                        disabled={isSyncing}
                        className="flex-1 min-w-[150px] border border-[#fed65b]/30 hover:border-[#fed65b] hover:bg-[#fed65b]/5 text-[#fed65b] py-3.5 font-mono text-xs uppercase tracking-widest font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <FileSpreadsheet size={13} />
                        {isSyncing ? "Syncing..." : "Sync Formula"}
                      </button>
                      <button
                        onClick={() => setCuratedResult(null)}
                        className="px-4 py-3.5 border border-white/10 hover:border-white/30 text-white/60 hover:text-white transition-all flex items-center justify-center"
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
    </div>

      {/* Sheets Ledger Section */}
      {activeTab === 'ledger' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto min-h-screen relative z-10"
        >
          <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-[#fed65b] mb-2">
                  <Database size={14} />
                  Atelier Cloud Ledger
                </div>
                <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white leading-tight">
                  The Atelier Ledger
                </h1>
                <p className="text-sm text-white/50 leading-relaxed font-light mt-1">
                  Manage and review your custom formulation library and boutique purchase allocations in real-time.
                </p>
              </div>

              {googleUser && (
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2.5 rounded-xl font-mono text-[10px]">
                  <div className="w-8 h-8 rounded-full bg-[#fed65b]/20 flex items-center justify-center text-[#fed65b] font-bold uppercase overflow-hidden border border-white/10">
                    {googleUser.photoURL ? (
                      <img src={googleUser.photoURL} alt="Profile" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      googleUser.displayName ? googleUser.displayName[0] : googleUser.email ? googleUser.email[0] : 'U'
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-medium">{googleUser.displayName || "Atelier Member"}</span>
                    <span className="text-white/40">{googleUser.email}</span>
                  </div>
                  <button
                    onClick={handleGoogleSignOut}
                    className="ml-4 p-1.5 hover:bg-white/10 text-white/60 hover:text-white rounded-md transition-colors"
                    title="Sign Out"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Error messages */}
            {sheetsError && (
              <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-xl text-xs text-red-300 font-mono flex items-start gap-2.5">
                <div className="font-bold">Error:</div>
                <div className="flex-1">{sheetsError}</div>
              </div>
            )}

            {/* Auth states / Dashboard content */}
            {!googleUser ? (
              /* Unauthenticated view */
              <div className="glass-card rounded-2xl border border-white/10 bg-white/[0.01] p-12 text-center max-w-xl mx-auto space-y-8 my-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#fed65b]/5 via-transparent to-transparent opacity-40" />
                
                <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center mx-auto text-[#fed65b]">
                  <Lock size={24} className="stroke-1" />
                </div>

                <div className="space-y-3">
                  <h2 className="text-xl font-light text-white">Unlock the Atelier Ledger</h2>
                  <p className="text-xs text-white/50 leading-relaxed font-light">
                    Sign in to your Atelier Lounge account to view and manage your custom formulation library and boutique purchase allocations securely stored in our cloud database.
                  </p>
                </div>

                <button 
                  onClick={() => setIsAuthOpen(true)}
                  className="mx-auto flex items-center justify-center gap-2 bg-[#fed65b] hover:bg-[#fed65b]/80 text-black font-mono text-xs uppercase tracking-wider px-8 py-4 transition-all duration-300 font-semibold cursor-pointer select-none active:scale-95 shadow-lg shadow-[#fed65b]/10"
                >
                  <User size={14} />
                  <span>Sign In / Register</span>
                </button>
              </div>
            ) : (
              /* Authenticated view */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Sidebar: Controls & Config */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Ledger Connection State Card */}
                  <div className="glass-card p-6 rounded-xl border border-white/5 bg-white/[0.01] space-y-4">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-white flex items-center gap-2">
                      <Database size={13} className="text-[#fed65b]" />
                      Ledger Status
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 bg-emerald-950/20 border border-emerald-900/30 p-3 rounded-lg">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                          Cloud Vault: Active Sync
                        </div>
                      </div>

                      {spreadsheetId ? (
                        <div className="flex items-center gap-2 bg-green-950/20 border border-green-900/30 p-3 rounded-lg">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          <div className="text-[10px] font-mono text-green-400 uppercase tracking-wider">
                            Google Sheets: Connected
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-neutral-900/40 border border-white/5 p-3 rounded-lg">
                          <span className="h-2 w-2 rounded-full bg-neutral-600"></span>
                          <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                            Google Sheets: Offline
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Google Sheets Workspace Card */}
                  <div className="glass-card p-6 rounded-xl border border-white/5 bg-white/[0.01]">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                      <FileSpreadsheet size={13} className="text-[#fed65b]" />
                      Google Sheets Live Sync
                    </h3>

                    {!googleToken ? (
                      <div className="space-y-4">
                        <p className="text-xs text-white/50 leading-relaxed font-light">
                          Mirror your purchases and custom formulation recipes in real-time into your personal Google Sheets.
                        </p>
                        <button 
                          onClick={handleGoogleSignIn}
                          className="w-full flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-black font-mono text-[10px] uppercase tracking-wider py-2.5 transition-all duration-300 font-bold"
                        >
                          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-3.5 h-3.5">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                          </svg>
                          Connect Google Sheets
                        </button>
                      </div>
                    ) : spreadsheetId ? (
                      <div className="space-y-4">
                        <div className="p-3 bg-black/40 rounded border border-white/5 space-y-1">
                          <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider">Spreadsheet ID</span>
                          <p className="text-[10px] font-mono text-white/80 break-all select-all">{spreadsheetId}</p>
                        </div>

                        <div className="flex flex-col gap-2">
                          <a
                            href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-[#fed65b] hover:bg-[#fed65b]/80 text-black py-2 font-mono text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 font-bold text-center"
                          >
                            Open Google Sheet
                            <ExternalLink size={11} />
                          </a>
                          <button
                            onClick={() => fetchLedgerData(googleToken!, spreadsheetId)}
                            disabled={isSheetsLoading}
                            className="w-full border border-white/10 hover:bg-white/5 text-white py-2 font-mono text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <RefreshCw size={11} className={isSheetsLoading ? "animate-spin" : ""} />
                            Force Refresh Data
                          </button>
                          <button
                            onClick={handleGoogleSignOut}
                            className="w-full border border-red-900/30 hover:bg-red-950/20 text-red-400 py-1.5 font-mono text-[9px] uppercase tracking-wider transition-all"
                          >
                            Disconnect Sheets
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-xs text-white/50 leading-relaxed font-light">
                          No "Aetheria Parfums Ledger" spreadsheet was found in your Google Drive. Click below to initialize a secure spreadsheet ledger containing "Orders" and "Custom Formulas" sheets.
                        </p>
                        <button
                          onClick={handleInitializeSpreadsheet}
                          disabled={isSheetsLoading}
                          className="w-full bg-[#fed65b] hover:bg-[#fed65b]/80 text-black py-2.5 font-mono text-[10px] uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5"
                        >
                          {isSheetsLoading ? (
                            <>
                              <RefreshCw size={11} className="animate-spin" />
                              Initializing...
                            </>
                          ) : (
                            <>
                              <FileSpreadsheet size={12} />
                              Initialize Spreadsheet
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleGoogleSignOut}
                          className="w-full border border-white/10 hover:bg-white/5 text-white/60 hover:text-white py-1.5 font-mono text-[9px] uppercase tracking-wider transition-all"
                        >
                          Disconnect Account
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Local Export Card */}
                  <div className="glass-card p-6 rounded-xl border border-white/5 bg-white/[0.01] space-y-4">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-white flex items-center gap-2">
                      <Layers size={13} className="text-[#fed65b]" />
                      Local Ledger Export
                    </h3>
                    <p className="text-xs text-white/50 leading-relaxed font-light">
                      Download your raw custom fragrance formulations and purchase history directly as standard offline-compatible CSV sheets.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => exportToCSV('orders')}
                        className="border border-white/10 hover:bg-white/5 text-white/90 py-2.5 rounded font-mono text-[9px] uppercase tracking-wider transition-all"
                      >
                        Export Orders
                      </button>
                      <button
                        onClick={() => exportToCSV('formulas')}
                        className="border border-white/10 hover:bg-white/5 text-white/90 py-2.5 rounded font-mono text-[9px] uppercase tracking-wider transition-all"
                      >
                        Export Formulas
                      </button>
                    </div>
                  </div>

                  {/* Guide Card */}
                  <div className="glass-card p-6 rounded-xl border border-white/5 bg-white/[0.01] text-xs space-y-3 font-light text-white/60 leading-relaxed">
                    <h4 className="font-mono text-white text-[10px] uppercase tracking-wider">How Sync Works</h4>
                    <p>
                      <strong className="text-white/80 font-normal">Real-Time Checkout Logs:</strong> When checking out standard orders, each purchase is logged automatically to the cloud.
                    </p>
                    <p>
                      <strong className="text-white/80 font-normal">Custom Formulator Sync:</strong> When using the Scent Finder, click "Sync Formula" to save the AI story, top, heart, and base notes.
                    </p>
                  </div>
                </div>

                {/* Right Column: Spreadsheet View tables */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Tab selections for sheets */}
                  <div className="flex border-b border-white/10 font-mono text-xs">
                    <button
                      onClick={() => setActiveLedgerSubTab('orders')}
                      className={`px-4 py-2.5 border-b-2 font-medium transition-all flex items-center gap-2 ${
                        activeLedgerSubTab === 'orders' ? 'border-[#fed65b] text-white' : 'border-transparent text-white/40 hover:text-white/80'
                      }`}
                    >
                      <Table size={12} />
                      Orders Tab ({ordersToDisplay.length})
                    </button>
                    <button
                      onClick={() => setActiveLedgerSubTab('formulas')}
                      className={`px-4 py-2.5 border-b-2 font-medium transition-all flex items-center gap-2 ${
                        activeLedgerSubTab === 'formulas' ? 'border-[#fed65b] text-white' : 'border-transparent text-white/40 hover:text-white/80'
                      }`}
                    >
                      <Layers size={12} />
                      Custom Formulas Tab ({formulasToDisplay.length})
                    </button>
                  </div>

                  {isSheetsLoading ? (
                    <div className="py-20 text-center text-xs font-mono text-white/40 space-y-3">
                      <RefreshCw size={24} className="animate-spin text-[#fed65b] mx-auto" />
                      <p>Syncing rows from your secure cloud ledger...</p>
                    </div>
                  ) : activeLedgerSubTab === 'orders' ? (
                    /* Orders Sheet Table */
                    <div className="overflow-x-auto border border-white/5 rounded-xl bg-black/25">
                      {ordersToDisplay.length === 0 ? (
                        <div className="p-12 text-center text-xs text-white/40 font-light leading-relaxed">
                          No synced orders. Complete a checkout in the shopping bag to see it synced here in real-time.
                        </div>
                      ) : (
                        <table className="w-full text-left font-mono text-[10px] text-white/70 min-w-[700px]">
                          <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5 text-white font-medium uppercase text-[8px] tracking-wider">
                              <th className="p-3">Order ID</th>
                              <th className="p-3">Date</th>
                              <th className="p-3">Type</th>
                              <th className="p-3">Product Name</th>
                              <th className="p-3">Size</th>
                              <th className="p-3">Qty</th>
                              <th className="p-3">Total</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-light">
                            {ordersToDisplay.map((row, idx) => (
                              <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                                <td className="p-3 text-[#fed65b] font-medium">{row[0]}</td>
                                <td className="p-3 text-white/40">{row[1]}</td>
                                <td className="p-3">
                                  <span className={`px-1.5 py-0.5 rounded-full text-[8px] ${
                                    row[2] === 'Custom' ? 'bg-[#fed65b]/10 text-[#fed65b]' : 'bg-white/10 text-white'
                                  }`}>
                                    {row[2]}
                                  </span>
                                </td>
                                <td className="p-3 text-white font-normal">{row[3]}</td>
                                <td className="p-3 text-white/40">{row[4]}</td>
                                <td className="p-3">{row[5]}</td>
                                <td className="p-3 text-white font-medium">{row[6]}</td>
                                <td className="p-3 text-emerald-400">{row[8]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ) : (
                    /* Custom Formulas Sheet Table */
                    <div className="overflow-x-auto border border-white/5 rounded-xl bg-black/25">
                      {formulasToDisplay.length === 0 ? (
                        <div className="p-12 text-center text-xs text-white/40 font-light leading-relaxed">
                          No exported custom formulations. Synthesize a fragrance in "The Finder" and click "Sync Formula" to save it here.
                        </div>
                      ) : (
                        <table className="w-full text-left font-mono text-[10px] text-white/70 min-w-[800px]">
                          <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5 text-white font-medium uppercase text-[8px] tracking-wider">
                              <th className="p-3">Formula Name</th>
                              <th className="p-3">Date Curated</th>
                              <th className="p-3">Archetype Vibe</th>
                              <th className="p-3">Top Notes</th>
                              <th className="p-3">Heart Notes</th>
                              <th className="p-3">Base Notes</th>
                              <th className="p-3">Match Score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-light">
                            {formulasToDisplay.map((row, idx) => (
                              <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                                <td className="p-3 text-[#fed65b] font-normal">{row[0]}</td>
                                <td className="p-3 text-white/40">{row[1]}</td>
                                <td className="p-3">{row[3]}</td>
                                <td className="p-3 text-white/80">{row[5]}</td>
                                <td className="p-3 text-white/80">{row[6]}</td>
                                <td className="p-3 text-white/80">{row[7]}</td>
                                <td className="p-3 text-[#fed65b] font-medium">{row[8]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Owner Dashboard Section */}
      {activeTab === 'dashboard' && isAdmin && (
        <OwnerDashboard 
          onBackToStore={() => setActiveTab('collections')}
          currency={currency}
          defaultFragrances={FRAGRANCES}
        />
      )}

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
        onCheckoutSuccess={handleCheckoutSuccess}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={googleUser}
        onUserChanged={(user, token) => {
          setGoogleUser(user);
          setGoogleToken(token || null);
          if (token) {
            handleLoadSpreadsheet(token);
          } else if (!user) {
            setSpreadsheetId(null);
            setSheetOrders([]);
            setSheetFormulas([]);
          }
        }}
        currency={currency}
      />
    </div>
  );
}
