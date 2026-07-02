import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  Settings, 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  Check, 
  X, 
  ChevronRight, 
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Info,
  Calendar,
  CheckCircle,
  Clock,
  Tag,
  Archive,
  Lock
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { Fragrance, Order, Customer } from "../types";
import { 
  fetchAllOrdersFromFirestore, 
  updateOrderStatusInFirestore, 
  deleteOrderFromFirestore, 
  fetchProductsFromFirestore, 
  saveProductToFirestore, 
  deleteProductFromFirestore, 
  fetchStoreSettings, 
  saveStoreSettings, 
  fetchAllCustomersFromFirestore,
  StoreSettings 
} from "../utils/firestoreService";
import { formatPrice } from "../utils/currency";

interface OwnerDashboardProps {
  onBackToStore: () => void;
  currency: any;
  defaultFragrances: Fragrance[];
}

export default function OwnerDashboard({ onBackToStore, currency, defaultFragrances }: OwnerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'customers' | 'settings'>('overview');
  
  // Dynamic Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    settingId: "store",
    storeName: "Aetheria Parfums",
    storeDescription: "Redefining the digital architecture of luxury emotion through meticulously curated signature scents.",
    shippingCharges: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Detail & Form Modal States
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCustomerOrders, setSelectedCustomerOrders] = useState<Order[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Search & Filter States
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [productSearch, setProductSearch] = useState("");
  const [productCollectionFilter, setProductCollectionFilter] = useState("All");
  const [customerSearch, setCustomerSearch] = useState("");

  // Product Form State
  const [productForm, setProductForm] = useState({
    id: "",
    name: "",
    collection: "Universal",
    notes: "",
    image: "",
    description: "",
    price: 150,
    detailedStory: "",
    topNotes: "",
    heartNotes: "",
    baseNotes: "",
    volume: "100ml",
    isFeatured: false,
    isOutOfStock: false,
    stockCount: 50
  });

  // Load all dashboard data
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Load Store Settings
      const settings = await fetchStoreSettings();
      if (settings) {
        setStoreSettings(settings);
      } else {
        await saveStoreSettings(storeSettings);
      }

      // 2. Load Products Catalog
      let dbProducts = await fetchProductsFromFirestore();
      if (dbProducts.length === 0) {
        // Seed database if empty
        const seeded = defaultFragrances.map(f => ({
          ...f,
          isFeatured: f.collection === 'Bespoke' || f.id === 'homme-vetiver-oud',
          isOutOfStock: false,
          stockCount: f.id === 'midnight-amber-vault' ? 3 : 25
        }));
        for (const p of seeded) {
          await saveProductToFirestore(p);
        }
        dbProducts = seeded;
      }
      setProducts(dbProducts);

      // 3. Load Orders
      const dbOrders = await fetchAllOrdersFromFirestore();
      setOrders(dbOrders);

      // 4. Load Customers
      const dbCustomers = await fetchAllCustomersFromFirestore();
      // Ensure we extract unique customers from orders too if they are not in the users table
      const orderCustomersMap = new Map<string, Customer>();
      dbCustomers.forEach(c => {
        orderCustomersMap.set(c.uid, c);
      });
      dbOrders.forEach(o => {
        if (o.userId && !orderCustomersMap.has(o.userId)) {
          orderCustomersMap.set(o.userId, {
            uid: o.userId,
            displayName: o.customerName || "Anonymous Client",
            email: o.userId.includes("anonymous") ? "guest-checkout@aetheria.com" : "customer@aetheria.com"
          });
        }
      });
      setCustomers(Array.from(orderCustomersMap.values()));

    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [defaultFragrances]);

  // Handle order status update
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setIsActionLoading(true);
    try {
      await updateOrderStatusInFirestore(orderId, newStatus);
      setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.orderId === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      alert("Failed to update status.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle order deletion
  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm(`Are you sure you want to delete order ${orderId}?`)) return;
    setIsActionLoading(true);
    try {
      await deleteOrderFromFirestore(orderId);
      setOrders(prev => prev.filter(o => o.orderId !== orderId));
      setSelectedOrder(null);
    } catch (err) {
      alert("Failed to delete order.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Save Store Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      await saveStoreSettings(storeSettings);
      alert("Store settings saved successfully!");
    } catch (err) {
      alert("Failed to save store settings.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Open modal to add product
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      id: "",
      name: "",
      collection: "Universal",
      notes: "",
      image: "",
      description: "",
      price: 150,
      detailedStory: "",
      topNotes: "",
      heartNotes: "",
      baseNotes: "",
      volume: "100ml",
      isFeatured: false,
      isOutOfStock: false,
      stockCount: 30
    });
    setIsProductModalOpen(true);
  };

  // Open modal to edit product
  const handleOpenEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      id: product.id,
      name: product.name,
      collection: product.collection || "Universal",
      notes: Array.isArray(product.notes) ? product.notes.join(", ") : (product.notes || ""),
      image: product.image || "",
      description: product.description || "",
      price: product.price || 150,
      detailedStory: product.detailedStory || "",
      topNotes: Array.isArray(product.topNotes) ? product.topNotes.join(", ") : (product.topNotes || ""),
      heartNotes: Array.isArray(product.heartNotes) ? product.heartNotes.join(", ") : (product.heartNotes || ""),
      baseNotes: Array.isArray(product.baseNotes) ? product.baseNotes.join(", ") : (product.baseNotes || ""),
      volume: product.volume || "100ml",
      isFeatured: !!product.isFeatured,
      isOutOfStock: !!product.isOutOfStock,
      stockCount: product.stockCount !== undefined ? product.stockCount : 30
    });
    setIsProductModalOpen(true);
  };

  // Handle Product form submit
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.id || !productForm.name || !productForm.price) {
      alert("ID, Name, and Price are required.");
      return;
    }

    // Prepare arrays
    const cleanNotes = productForm.notes.split(",").map(n => n.trim()).filter(Boolean);
    const cleanTop = productForm.topNotes.split(",").map(n => n.trim()).filter(Boolean);
    const cleanHeart = productForm.heartNotes.split(",").map(n => n.trim()).filter(Boolean);
    const cleanBase = productForm.baseNotes.split(",").map(n => n.trim()).filter(Boolean);

    const productPayload = {
      ...productForm,
      id: productForm.id.toLowerCase().replace(/\s+/g, "-"),
      notes: cleanNotes,
      topNotes: cleanTop,
      heartNotes: cleanHeart,
      baseNotes: cleanBase,
      price: Number(productForm.price),
      stockCount: Number(productForm.stockCount)
    };

    setIsActionLoading(true);
    try {
      await saveProductToFirestore(productPayload);
      if (editingProduct) {
        setProducts(prev => prev.map(p => p.id === productPayload.id ? productPayload : p));
      } else {
        setProducts(prev => [...prev, productPayload]);
      }
      setIsProductModalOpen(false);
      alert("Product saved successfully!");
    } catch (err) {
      alert("Failed to save product.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle product deletion
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm(`Are you sure you want to delete this product?`)) return;
    setIsActionLoading(true);
    try {
      await deleteProductFromFirestore(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      alert("Failed to delete product.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // View Customer Details and Order History
  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    const customerOrders = orders.filter(o => o.userId === customer.uid);
    setSelectedCustomerOrders(customerOrders);
  };

  // ----------------- CALC STATISTICS -----------------
  const parseCurrencyNumber = (pricePaidStr: string) => {
    // Extracts numeric values from strings like "$185.00" or "£245.00"
    const cleaned = pricePaidStr.replace(/[^\d.]/g, "");
    return parseFloat(cleaned) || 0;
  };

  const totalRevenue = orders
    .filter(o => o.status !== "Cancelled")
    .reduce((sum, o) => sum + parseCurrencyNumber(o.pricePaid), 0);

  const lowStockProducts = products.filter(p => (p.stockCount !== undefined && p.stockCount <= 5) || p.isOutOfStock);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "Pending" || o.status === "Confirmed").length;
  const processingOrders = orders.filter(o => o.status === "Processing").length;
  const deliveredOrders = orders.filter(o => o.status === "Delivered").length;
  const totalCustomers = customers.length;

  // ----------------- GENERATE CHART DATA -----------------
  // Group sales by date
  const getSalesChartData = () => {
    const dailySalesMap = new Map<string, number>();
    // Pre-populate last 7 days to look good even if no data
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailySalesMap.set(d.toLocaleDateString(), 0);
    }

    orders
      .filter(o => o.status !== "Cancelled")
      .forEach(o => {
        const orderDateStr = o.date ? o.date.split(" ")[0] : "";
        if (orderDateStr) {
          const current = dailySalesMap.get(orderDateStr) || 0;
          dailySalesMap.set(orderDateStr, current + parseCurrencyNumber(o.pricePaid));
        }
      });

    return Array.from(dailySalesMap.entries()).map(([date, revenue]) => ({
      date: date.substring(0, 5), // 'MM/DD' format
      Revenue: revenue
    })).slice(-10); // show last 10 records
  };

  const getCollectionDistribution = () => {
    const counts: { [key: string]: number } = {};
    products.forEach(p => {
      counts[p.collection] = (counts[p.collection] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const salesData = getSalesChartData();
  const distributionData = getCollectionDistribution();

  // ----------------- SEARCH & FILTERS -----------------
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderId.toLowerCase().includes(orderSearch.toLowerCase()) || 
                          o.customerName.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = orderStatusFilter === "All" || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          p.id.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCollection = productCollectionFilter === "All" || p.collection === productCollectionFilter;
    return matchesSearch && matchesCollection;
  });

  const filteredCustomers = customers.filter(c => {
    return c.email.toLowerCase().includes(customerSearch.toLowerCase()) || 
           (c.displayName && c.displayName.toLowerCase().includes(customerSearch.toLowerCase()));
  });

  return (
    <div className="pt-28 pb-20 px-6 md:px-12 max-w-7xl mx-auto min-h-screen relative z-10 text-white font-sans">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-[#fed65b] mb-2">
            <LayoutDashboard size={14} />
            Administrative Center
          </div>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white leading-tight">
            The Atelier Dashboard
          </h1>
          <p className="text-sm text-white/50 leading-relaxed font-light mt-1">
            Real-time management of products, customer registries, orders, and store parameters.
          </p>
        </div>

        <button
          onClick={onBackToStore}
          className="flex items-center gap-2 border border-white/10 hover:bg-white/5 px-4 py-2 text-xs font-mono tracking-widest uppercase transition-colors"
        >
          <ArrowLeft size={12} />
          Return to Storefront
        </button>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap border-b border-white/5 font-mono text-xs mb-8">
        <button
          onClick={() => { setActiveTab('overview'); setSelectedCustomer(null); }}
          className={`px-5 py-3 border-b-2 font-medium transition-all flex items-center gap-2 ${
            activeTab === 'overview' ? 'border-[#fed65b] text-white bg-white/[0.01]' : 'border-transparent text-white/40 hover:text-white/80'
          }`}
        >
          <TrendingUp size={13} />
          Overview
        </button>
        <button
          onClick={() => { setActiveTab('orders'); setSelectedCustomer(null); }}
          className={`px-5 py-3 border-b-2 font-medium transition-all flex items-center gap-2 ${
            activeTab === 'orders' ? 'border-[#fed65b] text-white bg-white/[0.01]' : 'border-transparent text-white/40 hover:text-white/80'
          }`}
        >
          <ShoppingBag size={13} />
          Orders ({orders.length})
        </button>
        <button
          onClick={() => { setActiveTab('products'); setSelectedCustomer(null); }}
          className={`px-5 py-3 border-b-2 font-medium transition-all flex items-center gap-2 ${
            activeTab === 'products' ? 'border-[#fed65b] text-white bg-white/[0.01]' : 'border-transparent text-white/40 hover:text-white/80'
          }`}
        >
          <Package size={13} />
          Products Catalog ({products.length})
        </button>
        <button
          onClick={() => { setActiveTab('customers'); setSelectedCustomer(null); }}
          className={`px-5 py-3 border-b-2 font-medium transition-all flex items-center gap-2 ${
            activeTab === 'customers' ? 'border-[#fed65b] text-white bg-white/[0.01]' : 'border-transparent text-white/40 hover:text-white/80'
          }`}
        >
          <Users size={13} />
          Customers ({customers.length})
        </button>
        <button
          onClick={() => { setActiveTab('settings'); setSelectedCustomer(null); }}
          className={`px-5 py-3 border-b-2 font-medium transition-all flex items-center gap-2 ${
            activeTab === 'settings' ? 'border-[#fed65b] text-white bg-white/[0.01]' : 'border-transparent text-white/40 hover:text-white/80'
          }`}
        >
          <Settings size={13} />
          Settings
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-xs font-mono text-white/40 space-y-4">
          <RefreshCw size={24} className="animate-spin text-[#fed65b] mx-auto" />
          <p>Querying luxury ledger data stream...</p>
        </div>
      ) : (
        <div>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && !selectedCustomer && (
            <div className="space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-6 bg-white/[0.01] border border-white/5 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Total Revenue</span>
                    <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                      <DollarSign size={14} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-light font-mono text-white">
                    {formatPrice(totalRevenue, 'USD')}
                  </h3>
                  <p className="text-[10px] text-white/30 font-light leading-relaxed">
                    Excludes orders currently marked as Cancelled.
                  </p>
                </div>

                <div className="glass-card p-6 bg-white/[0.01] border border-white/5 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Allocated Orders</span>
                    <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
                      <ShoppingBag size={14} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-light font-mono text-white">
                    {totalOrders}
                  </h3>
                  <p className="text-[10px] text-white/30 font-mono">
                    {pendingOrders} Pending | {processingOrders} Processing
                  </p>
                </div>

                <div className="glass-card p-6 bg-white/[0.01] border border-white/5 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Active Customers</span>
                    <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg">
                      <Users size={14} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-light font-mono text-white">
                    {totalCustomers}
                  </h3>
                  <p className="text-[10px] text-white/30 font-light">
                    Clients with registered profiles or orders.
                  </p>
                </div>

                <div className="glass-card p-6 bg-white/[0.01] border border-white/5 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Low Stock Products</span>
                    <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
                      <AlertTriangle size={14} />
                    </div>
                  </div>
                  <h3 className={`text-2xl font-light font-mono ${lowStockProducts.length > 0 ? "text-amber-400 font-medium" : "text-white"}`}>
                    {lowStockProducts.length}
                  </h3>
                  <p className="text-[10px] text-white/30 font-light">
                    Scent models with stock ≤ 5 or out of stock.
                  </p>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sales Overview Chart */}
                <div className="lg:col-span-8 glass-card p-6 bg-white/[0.01] border border-white/5 rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-white flex items-center gap-1.5">
                      <TrendingUp size={13} className="text-[#fed65b]" />
                      Sales Velocity Overview
                    </h4>
                    <span className="text-[10px] text-white/40 font-mono">Last 10 days</span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#fed65b" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#fed65b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                        <XAxis dataKey="date" stroke="#666" fontSize={10} fontFamily="monospace" />
                        <YAxis stroke="#666" fontSize={10} fontFamily="monospace" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#141415", border: "1px solid #333", borderRadius: "8px" }}
                          labelStyle={{ fontFamily: "monospace", fontSize: 10, color: "#fed65b" }}
                          itemStyle={{ fontFamily: "monospace", fontSize: 11, color: "#fff" }}
                        />
                        <Area type="monotone" dataKey="Revenue" stroke="#fed65b" strokeWidth={1.5} fillOpacity={1} fill="url(#colorSales)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Scent Wardrobe Inventory Distribution */}
                <div className="lg:col-span-4 glass-card p-6 bg-white/[0.01] border border-white/5 rounded-xl flex flex-col justify-between">
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-white flex items-center gap-1.5">
                      <Package size={13} className="text-[#fed65b]" />
                      Category Distribution
                    </h4>
                    <div className="h-44 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={distributionData} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                          <XAxis dataKey="name" stroke="#666" fontSize={8} fontFamily="monospace" />
                          <YAxis stroke="#666" fontSize={10} fontFamily="monospace" />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#141415", border: "1px solid #333", borderRadius: "8px" }}
                            itemStyle={{ fontFamily: "monospace", fontSize: 11, color: "#fff" }}
                          />
                          <Bar dataKey="value" fill="#fed65b">
                            {distributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#fed65b" : "#e9c349"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-4 border-t border-white/5 font-mono text-[9px] text-white/40">
                    <p className="flex justify-between">
                      <span>Homme (Masculine Core)</span>
                      <span className="text-white font-medium">{products.filter(p=>p.collection==='Homme').length} models</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Femme (Feminine Silk)</span>
                      <span className="text-white font-medium">{products.filter(p=>p.collection==='Femme').length} models</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Universal (Geometric Clean)</span>
                      <span className="text-white font-medium">{products.filter(p=>p.collection==='Universal').length} models</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Bespoke (Vault / Private Custom)</span>
                      <span className="text-white font-medium">{products.filter(p=>p.collection==='Bespoke').length} models</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Orders table */}
              <div className="glass-card p-6 bg-white/[0.01] border border-white/5 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-white">Recent Purchases Log</h4>
                  <button onClick={() => setActiveTab('orders')} className="text-[#fed65b] text-[10px] font-mono uppercase hover:underline flex items-center gap-1">
                    Manage Orders <ChevronRight size={10} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  {orders.length === 0 ? (
                    <div className="p-12 text-center text-xs text-white/40 font-light leading-relaxed">
                      No customer allocations found in database. Seed orders by completing checking out in the cart.
                    </div>
                  ) : (
                    <table className="w-full text-left font-mono text-[10px] text-white/70 min-w-[700px]">
                      <thead>
                        <tr className="bg-white/[0.02] border-b border-white/5 text-white font-medium uppercase text-[8px] tracking-wider">
                          <th className="p-3">Order ID</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Product Name</th>
                          <th className="p-3">Size/Qty</th>
                          <th className="p-3">Total Paid</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-light">
                        {orders.slice(0, 5).map((row) => (
                          <tr key={row.orderId} className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-3 text-[#fed65b] font-medium">{row.orderId}</td>
                            <td className="p-3 text-white/40">{row.date}</td>
                            <td className="p-3 text-white font-normal">{row.customerName}</td>
                            <td className="p-3 text-white/80 font-normal">{row.productName}</td>
                            <td className="p-3 text-white/40">{row.size} × {row.quantity}</td>
                            <td className="p-3 text-white font-medium">{row.pricePaid}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-medium uppercase tracking-wider ${
                                row.status === 'Cancelled' ? 'bg-red-950/40 text-red-400 border border-red-900/30' :
                                row.status === 'Delivered' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' :
                                'bg-[#fed65b]/10 text-[#fed65b] border border-[#fed65b]/20'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button 
                                onClick={() => setSelectedOrder(row)}
                                className="p-1.5 bg-white/5 hover:bg-white/10 text-white rounded transition-colors"
                                title="Inspect allocation"
                              >
                                <Eye size={11} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && !selectedCustomer && (
            <div className="space-y-6">
              {/* Controls bar */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                <div className="relative w-full md:max-w-md">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search Order ID or Customer Name..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-[#fed65b] font-mono text-white"
                  />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto font-mono text-xs">
                  <Filter size={13} className="text-white/40" />
                  <span className="text-white/40">Status:</span>
                  <div className="flex gap-1 bg-black/40 p-1 border border-white/10 rounded-lg">
                    {["All", "Confirmed", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => (
                      <button
                        key={status}
                        onClick={() => setOrderStatusFilter(status)}
                        className={`px-2.5 py-1 rounded-md text-[10px] transition-all ${
                          orderStatusFilter === status ? "bg-[#fed65b] text-black font-semibold" : "text-white/60 hover:text-white"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="glass-card p-6 bg-white/[0.01] border border-white/5 rounded-xl">
                <div className="overflow-x-auto">
                  {filteredOrders.length === 0 ? (
                    <div className="p-16 text-center text-xs text-white/40 font-light leading-relaxed">
                      No matching orders found in the luxury ledger matching current criteria.
                    </div>
                  ) : (
                    <table className="w-full text-left font-mono text-[10px] text-white/70 min-w-[800px]">
                      <thead>
                        <tr className="bg-white/[0.02] border-b border-white/5 text-white font-medium uppercase text-[8px] tracking-wider">
                          <th className="p-3">Order ID</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Scent Product</th>
                          <th className="p-3">Specs/Qty</th>
                          <th className="p-3">Total Paid</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-light">
                        {filteredOrders.map((row) => (
                          <tr key={row.orderId} className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-3 text-[#fed65b] font-medium">{row.orderId}</td>
                            <td className="p-3 text-white/40">{row.date}</td>
                            <td className="p-3 text-white font-normal">{row.customerName}</td>
                            <td className="p-3 text-white/80 font-normal">{row.productName}</td>
                            <td className="p-3 text-white/40">{row.size} × {row.quantity}</td>
                            <td className="p-3 text-white font-medium">{row.pricePaid}</td>
                            <td className="p-3">
                              <select
                                value={row.status}
                                onChange={(e) => handleUpdateStatus(row.orderId, e.target.value)}
                                disabled={isActionLoading}
                                className="bg-black border border-white/10 rounded px-2 py-0.5 text-[9px] font-mono text-white/80 focus:outline-none focus:border-[#fed65b]"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button 
                                onClick={() => setSelectedOrder(row)}
                                className="p-1.5 bg-white/5 hover:bg-white/10 text-white rounded transition-colors"
                                title="Inspect details"
                              >
                                <Eye size={11} />
                              </button>
                              <button 
                                onClick={() => handleDeleteOrder(row.orderId)}
                                className="p-1.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 rounded border border-red-900/30 transition-colors"
                                title="Archive Order"
                              >
                                <Trash2 size={11} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCTS CATALOG */}
          {activeTab === 'products' && !selectedCustomer && (
            <div className="space-y-6">
              {/* Controls and Actions */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row gap-3 w-full md:max-w-xl">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      placeholder="Search name, notes, code..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-[#fed65b] font-mono text-white"
                    />
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-white/40">Col:</span>
                    <select
                      value={productCollectionFilter}
                      onChange={(e) => setProductCollectionFilter(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white"
                    >
                      <option value="All">All Collections</option>
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                      <option value="Universal">Universal</option>
                      <option value="Bespoke">Bespoke</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleOpenAddProduct}
                  className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#fed65b] hover:bg-[#ffe088] text-black font-mono text-xs uppercase tracking-wider px-5 py-2.5 font-bold transition-all"
                >
                  <Plus size={13} />
                  Add Scent Design
                </button>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((p) => (
                  <div 
                    key={p.id} 
                    className="glass-card bg-[#0d0d0f] border border-white/5 hover:border-white/10 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-300 relative group"
                  >
                    {/* Featured label tag */}
                    {p.isFeatured && (
                      <span className="absolute top-3 left-3 bg-[#fed65b]/10 text-[#fed65b] border border-[#fed65b]/20 px-2 py-0.5 rounded-full font-mono text-[8px] uppercase tracking-wider z-20 flex items-center gap-1 font-semibold">
                        <Sparkles size={8} />
                        Featured
                      </span>
                    )}

                    {/* Stock level tag */}
                    <span className={`absolute top-3 right-3 border px-2 py-0.5 rounded-full font-mono text-[8px] uppercase tracking-wider z-20 font-semibold ${
                      p.isOutOfStock || (p.stockCount !== undefined && p.stockCount === 0)
                        ? "bg-red-950/55 border-red-900/40 text-red-400"
                        : p.stockCount !== undefined && p.stockCount <= 5
                        ? "bg-amber-950/55 border-amber-900/40 text-amber-400 animate-pulse"
                        : "bg-emerald-950/55 border-emerald-900/40 text-emerald-400"
                    }`}>
                      {p.isOutOfStock || (p.stockCount !== undefined && p.stockCount === 0)
                        ? "OUT OF STOCK"
                        : p.stockCount !== undefined && p.stockCount <= 5
                        ? `LOW STOCK (${p.stockCount})`
                        : `IN STOCK (${p.stockCount !== undefined ? p.stockCount : 25})`}
                    </span>

                    {/* Thumbnail */}
                    <div className="h-44 overflow-hidden bg-black/40 border-b border-white/5 relative">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal hover:scale-105 transition-all duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-4">
                        <span className="text-[9px] font-mono text-white/40 block uppercase tracking-widest">{p.collection} collection</span>
                        <h4 className="text-sm font-medium tracking-tight text-white">{p.name}</h4>
                      </div>
                    </div>

                    {/* Description Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <p className="text-xs font-light text-white/50 leading-relaxed line-clamp-2">
                          {p.description}
                        </p>
                        
                        {/* Note badges */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {Array.isArray(p.notes) && p.notes.map((n: string) => (
                            <span key={n} className="bg-white/5 border border-white/5 rounded px-2 py-0.5 text-[8px] font-mono text-white/60">
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Controls footer */}
                      <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-white/40 block font-mono">RETAIL PRICE</span>
                          <span className="text-sm font-mono text-[#fed65b] font-medium">{formatPrice(p.price, 'USD')}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/5"
                            title="Edit fields"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 bg-red-950/20 hover:bg-red-900/30 text-red-400 rounded-lg border border-red-900/30 transition-colors"
                            title="Delete scent"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMERS REGISTRY */}
          {activeTab === 'customers' && !selectedCustomer && (
            <div className="space-y-6">
              {/* Controls */}
              <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                <div className="relative max-w-md w-full">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search customer email or name..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-[#fed65b] font-mono text-white"
                  />
                </div>
              </div>

              {/* Directory list */}
              <div className="glass-card p-6 bg-white/[0.01] border border-white/5 rounded-xl">
                <div className="overflow-x-auto">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-16 text-center text-xs text-white/40 font-light leading-relaxed">
                      No matching clients found in the registered member database.
                    </div>
                  ) : (
                    <table className="w-full text-left font-mono text-[10px] text-white/70 min-w-[600px]">
                      <thead>
                        <tr className="bg-white/[0.02] border-b border-white/5 text-white font-medium uppercase text-[8px] tracking-wider">
                          <th className="p-3">Client Profile</th>
                          <th className="p-3">Email Address</th>
                          <th className="p-3">Registrar UID</th>
                          <th className="p-3">Total Purchases</th>
                          <th className="p-3">Total Spending</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-light">
                        {filteredCustomers.map((c) => {
                          const customerOrders = orders.filter(o => o.userId === c.uid);
                          const totalSpend = customerOrders
                            .filter(o => o.status !== "Cancelled")
                            .reduce((sum, o) => sum + parseCurrencyNumber(o.pricePaid), 0);

                          return (
                            <tr key={c.uid} className="hover:bg-white/[0.01] transition-colors">
                              <td className="p-3 font-normal flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-[#fed65b]/10 text-[#fed65b] flex items-center justify-center font-bold text-[10px] border border-[#fed65b]/20">
                                  {c.displayName ? c.displayName[0].toUpperCase() : 'C'}
                                </div>
                                <span className="text-white font-medium">{c.displayName || "Anonymous Client"}</span>
                              </td>
                              <td className="p-3 text-white/60">{c.email}</td>
                              <td className="p-3 text-white/30 truncate max-w-xs">{c.uid}</td>
                              <td className="p-3 text-white font-medium">{customerOrders.length} times</td>
                              <td className="p-3 text-[#fed65b] font-semibold">{formatPrice(totalSpend, 'USD')}</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleViewCustomer(c)}
                                  className="px-3 py-1 bg-white/5 hover:bg-[#fed65b] hover:text-black rounded text-[9px] font-mono uppercase tracking-wider transition-all"
                                >
                                  Inspect Profile
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === 'settings' && !selectedCustomer && (
            <div className="max-w-2xl mx-auto glass-card p-8 bg-white/[0.01] border border-white/5 rounded-xl space-y-6">
              <h3 className="text-sm font-mono uppercase tracking-wider text-white border-b border-white/15 pb-3">
                Storefront Configuration
              </h3>

              <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-wider text-white/40 font-semibold">
                    Global Brand Name
                  </label>
                  <input
                    type="text"
                    required
                    value={storeSettings.storeName}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, storeName: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] focus:ring-0 px-4 py-3 text-sm text-white rounded-lg font-mono transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-wider text-white/40 font-semibold">
                    Atelier Brand Creed & Tagline
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={storeSettings.storeDescription}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, storeDescription: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] focus:ring-0 px-4 py-3 text-sm text-white rounded-lg leading-relaxed transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-wider text-white/40 font-semibold flex justify-between">
                    <span>Flat Shipping Charges ($)</span>
                    <span className="text-[#fed65b]">Currently Free if 0</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={storeSettings.shippingCharges}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, shippingCharges: Number(e.target.value) }))}
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] focus:ring-0 px-4 py-3 text-sm text-white rounded-lg font-mono transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="w-full bg-[#fed65b] hover:bg-[#ffe088] text-black py-3.5 font-mono uppercase tracking-[0.2em] text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isActionLoading && <RefreshCw size={12} className="animate-spin" />}
                  Deploy Store Parameters
                </button>
              </form>
            </div>
          )}

          {/* SUB-VIEW: CUSTOMER PROFILE & HISTORY VIEW */}
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Back to registry */}
              <button
                onClick={() => setSelectedCustomer(null)}
                className="flex items-center gap-2 text-white/40 hover:text-white font-mono text-[10px] uppercase tracking-wider transition-colors mb-4"
              >
                <ArrowLeft size={10} />
                Back to Customer Registry
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Customer Details Box */}
                <div className="lg:col-span-4 glass-card p-6 bg-white/[0.01] border border-white/5 rounded-xl space-y-6">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-[#fed65b]/10 text-[#fed65b] flex items-center justify-center font-bold text-2xl border border-[#fed65b]/20 mx-auto">
                      {selectedCustomer.displayName ? selectedCustomer.displayName[0].toUpperCase() : 'C'}
                    </div>
                    <div>
                      <h4 className="text-md font-medium text-white">{selectedCustomer.displayName || "Anonymous Client"}</h4>
                      <p className="text-[10px] font-mono text-white/40">{selectedCustomer.email}</p>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4 space-y-3 font-mono text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-white/40 uppercase">User UID</span>
                      <span className="text-white font-light text-right select-all">{selectedCustomer.uid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40 uppercase">Allocated Orders</span>
                      <span className="text-white font-medium">{selectedCustomerOrders.length} times</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40 uppercase">Total Spent</span>
                      <span className="text-[#fed65b] font-semibold">
                        {formatPrice(selectedCustomerOrders.filter(o=>o.status!=="Cancelled").reduce((sum, o)=>sum+parseCurrencyNumber(o.pricePaid),0), 'USD')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Orders list */}
                <div className="lg:col-span-8 glass-card p-6 bg-white/[0.01] border border-white/5 rounded-xl space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-white">Purchase & Formulation Registry</h4>

                  <div className="overflow-x-auto">
                    {selectedCustomerOrders.length === 0 ? (
                      <div className="p-12 text-center text-xs text-white/40 font-light italic">
                        This client has no logged purchase transactions.
                      </div>
                    ) : (
                      <table className="w-full text-left font-mono text-[9px] text-white/70 min-w-[500px]">
                        <thead>
                          <tr className="bg-white/[0.02] border-b border-white/5 text-white font-medium uppercase text-[8px] tracking-wider">
                            <th className="p-3">Order ID</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Product Name</th>
                            <th className="p-3">Size/Qty</th>
                            <th className="p-3">Total Paid</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-light">
                          {selectedCustomerOrders.map((row) => (
                            <tr key={row.orderId} className="hover:bg-white/[0.01] transition-colors">
                              <td className="p-3 text-[#fed65b] font-medium">{row.orderId}</td>
                              <td className="p-3 text-white/40">{row.date}</td>
                              <td className="p-3 text-white font-normal">{row.productName}</td>
                              <td className="p-3 text-white/40">{row.size} × {row.quantity}</td>
                              <td className="p-3 text-white font-medium">{row.pricePaid}</td>
                              <td className="p-3">
                                <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-medium uppercase tracking-wider ${
                                  row.status === 'Cancelled' ? 'bg-red-950/40 text-red-400 border border-red-900/30' :
                                  row.status === 'Delivered' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' :
                                  'bg-[#fed65b]/10 text-[#fed65b] border border-[#fed65b]/20'
                                }`}>
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------- MODAL: DETAILED ORDER INSPECTOR ----------------- */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg glass-card text-white rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-[#0a0a0b]/95 p-6 space-y-6"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div>
                  <span className="text-[9px] font-mono text-[#fed65b] uppercase tracking-[0.2em] block">Allocation Details</span>
                  <h3 className="text-base font-light font-mono text-white">{selectedOrder.orderId}</h3>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-full text-white/50 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Specs */}
              <div className="space-y-4 font-mono text-[10px]">
                <div className="grid grid-cols-2 gap-4 bg-white/[0.01] p-3 rounded-lg border border-white/5">
                  <div>
                    <span className="text-white/40 block text-[8px] uppercase">Client Name</span>
                    <span className="text-white text-xs">{selectedOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[8px] uppercase">Registered ID</span>
                    <span className="text-white truncate block" title={selectedOrder.userId}>{selectedOrder.userId}</span>
                  </div>
                </div>

                <div className="space-y-1 bg-white/[0.01] p-3 rounded-lg border border-white/5">
                  <span className="text-white/40 block text-[8px] uppercase">Destination Address</span>
                  <p className="text-white leading-relaxed">{selectedOrder.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-white/[0.01] p-3 rounded-lg border border-white/5">
                  <div>
                    <span className="text-white/40 block text-[8px] uppercase">Scent Design</span>
                    <span className="text-white text-xs block truncate">{selectedOrder.productName}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[8px] uppercase">Size/Qty Selection</span>
                    <span className="text-white text-xs block">{selectedOrder.size} × {selectedOrder.quantity}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-white/[0.01] p-3 rounded-lg border border-white/5">
                  <div>
                    <span className="text-white/40 block text-[8px] uppercase">Allocation Status</span>
                    <span className="text-white font-semibold text-[#fed65b] uppercase tracking-wider">{selectedOrder.status}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[8px] uppercase">Total Paid</span>
                    <span className="text-white font-semibold text-emerald-400 text-xs block">{selectedOrder.pricePaid}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-white/40 block text-[8px] uppercase mb-1">Modify Status Gate</label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleUpdateStatus(selectedOrder.orderId, e.target.value)}
                    disabled={isActionLoading}
                    className="w-full bg-black border border-white/10 rounded-lg p-2 font-mono text-white/80 focus:outline-none focus:border-[#fed65b] text-xs"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex justify-end gap-3 font-mono text-[10px]">
                <button
                  onClick={() => handleDeleteOrder(selectedOrder.orderId)}
                  className="px-4 py-2 border border-red-900/40 text-red-400 hover:bg-red-900/10 rounded uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Archive size={11} />
                  Archive/Delete Order
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-white text-black hover:bg-neutral-200 rounded uppercase tracking-wider font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL: ADD / EDIT PRODUCT FORM ----------------- */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl glass-card text-white rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-[#0a0a0b]/95 p-6"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-6">
                <div>
                  <span className="text-[9px] font-mono text-[#fed65b] uppercase tracking-[0.2em] block">Scent Engineering Vault</span>
                  <h3 className="text-md font-light text-white">
                    {editingProduct ? "Edit Fragrance Specifications" : "Create New Luxury Scent Model"}
                  </h3>
                </div>
                <button
                  onClick={() => setIsProductModalOpen(false)}
                  className="p-1.5 rounded-full text-white/50 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[9px] uppercase tracking-wider text-white/40 font-semibold font-mono">
                      Product Unique Key ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="homme-vetiver-oud"
                      disabled={!!editingProduct}
                      value={productForm.id}
                      onChange={(e) => setProductForm(prev => ({ ...prev, id: e.target.value }))}
                      className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] px-3 py-2 text-white rounded font-mono disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] uppercase tracking-wider text-white/40 font-semibold font-mono">
                      Fragrance Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Vetiver Majestic"
                      value={productForm.name}
                      onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] px-3 py-2 text-white rounded"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[9px] uppercase tracking-wider text-white/40 font-semibold font-mono">
                      Collection Classification
                    </label>
                    <select
                      value={productForm.collection}
                      onChange={(e) => setProductForm(prev => ({ ...prev, collection: e.target.value }))}
                      className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] px-3 py-2 text-white rounded"
                    >
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                      <option value="Universal">Universal</option>
                      <option value="Bespoke">Bespoke</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] uppercase tracking-wider text-white/40 font-semibold font-mono">
                      Retail Price (USD) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="185"
                      value={productForm.price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] px-3 py-2 text-white rounded font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] uppercase tracking-wider text-white/40 font-semibold font-mono">
                      Initial Stock Level
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="25"
                      value={productForm.stockCount}
                      onChange={(e) => setProductForm(prev => ({ ...prev, stockCount: Number(e.target.value) }))}
                      className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] px-3 py-2 text-white rounded font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] uppercase tracking-wider text-white/40 font-semibold font-mono">
                    High-Res Product Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={productForm.image}
                    onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] px-3 py-2 text-white rounded font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] uppercase tracking-wider text-white/40 font-semibold font-mono">
                    Brief Visual & Creative Description
                  </label>
                  <input
                    type="text"
                    placeholder="A moody, high-fashion architectural heavy-glass composition."
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] px-3 py-2 text-white rounded"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] uppercase tracking-wider text-white/40 font-semibold font-mono">
                    Full Scent Editorial Story / Backstory
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide a detailed editorial write-up about how this scent represents tension..."
                    value={productForm.detailedStory}
                    onChange={(e) => setProductForm(prev => ({ ...prev, detailedStory: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] px-3 py-2 text-white rounded leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] uppercase tracking-wider text-white/40 font-semibold font-mono">
                    Scent Notes (comma separated list)
                  </label>
                  <input
                    type="text"
                    placeholder="Vetiver, Oud, Smoked Amber, Cognac"
                    value={productForm.notes}
                    onChange={(e) => setProductForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] px-3 py-2 text-white rounded font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[9px] uppercase tracking-wider text-white/40 font-semibold font-mono">
                      Top Notes (comma-sep)
                    </label>
                    <input
                      type="text"
                      placeholder="Bergamot, Pepper"
                      value={productForm.topNotes}
                      onChange={(e) => setProductForm(prev => ({ ...prev, topNotes: e.target.value }))}
                      className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] px-3 py-2 text-white rounded font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] uppercase tracking-wider text-white/40 font-semibold font-mono">
                      Heart Notes (comma-sep)
                    </label>
                    <input
                      type="text"
                      placeholder="Smoky Vetiver, Cypress"
                      value={productForm.heartNotes}
                      onChange={(e) => setProductForm(prev => ({ ...prev, heartNotes: e.target.value }))}
                      className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] px-3 py-2 text-white rounded font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] uppercase tracking-wider text-white/40 font-semibold font-mono">
                      Base Notes (comma-sep)
                    </label>
                    <input
                      type="text"
                      placeholder="Vietnamese Oud, Musk"
                      value={productForm.baseNotes}
                      onChange={(e) => setProductForm(prev => ({ ...prev, baseNotes: e.target.value }))}
                      className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] px-3 py-2 text-white rounded font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <label className="flex items-center gap-2 bg-white/[0.02] border border-white/5 p-3 rounded-lg cursor-pointer hover:bg-white/[0.04]">
                    <input
                      type="checkbox"
                      checked={productForm.isFeatured}
                      onChange={(e) => setProductForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                      className="rounded bg-black border-white/15 text-[#fed65b] focus:ring-0 w-4 h-4"
                    />
                    <span className="font-mono text-[9px] uppercase tracking-wider">Featured Release</span>
                  </label>

                  <label className="flex items-center gap-2 bg-white/[0.02] border border-white/5 p-3 rounded-lg cursor-pointer hover:bg-white/[0.04]">
                    <input
                      type="checkbox"
                      checked={productForm.isOutOfStock}
                      onChange={(e) => setProductForm(prev => ({ ...prev, isOutOfStock: e.target.checked }))}
                      className="rounded bg-black border-white/15 text-[#fed65b] focus:ring-0 w-4 h-4"
                    />
                    <span className="font-mono text-[9px] uppercase tracking-wider">Out of Stock</span>
                  </label>

                  <div className="space-y-1">
                    <span className="block text-[8px] uppercase font-mono text-white/40">Default Volume</span>
                    <input
                      type="text"
                      placeholder="100ml"
                      value={productForm.volume}
                      onChange={(e) => setProductForm(prev => ({ ...prev, volume: e.target.value }))}
                      className="w-full bg-white/[0.03] border border-white/10 focus:border-[#fed65b] px-2.5 py-1 text-white rounded font-mono text-center"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end gap-3 font-mono">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-5 py-2.5 border border-white/10 hover:bg-white/5 rounded text-white uppercase tracking-wider font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isActionLoading}
                    className="px-5 py-2.5 bg-[#fed65b] hover:bg-[#ffe088] text-black rounded uppercase tracking-wider font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isActionLoading && <RefreshCw size={11} className="animate-spin" />}
                    Save Scent Design
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
