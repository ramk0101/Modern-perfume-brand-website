import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  LogOut, 
  Layers, 
  Sparkles, 
  Clock, 
  Trash2, 
  FileSpreadsheet, 
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { 
  signUpWithEmail, 
  signInWithEmail, 
  googleSignIn, 
  googleSignOut 
} from "../utils/firebaseAuth";
import { 
  saveUserProfile, 
  fetchOrdersFromFirestore, 
  fetchFormulasFromFirestore,
  deleteFormulaFromFirestore
} from "../utils/firestoreService";
import { User as FirebaseUser } from "firebase/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: FirebaseUser | null;
  onUserChanged: (user: FirebaseUser | null, googleToken?: string | null) => void;
  currency: string;
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  onUserChanged,
  currency 
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Firestore user history state
  const [savedFormulas, setSavedFormulas] = useState<any[]>([]);
  const [savedOrders, setSavedOrders] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadUserData(currentUser.uid);
    } else {
      setSavedFormulas([]);
      setSavedOrders([]);
    }
  }, [currentUser, isOpen]);

  const loadUserData = async (uid: string) => {
    setIsDataLoading(true);
    try {
      const [formulas, orders] = await Promise.all([
        fetchFormulasFromFirestore(uid),
        fetchOrdersFromFirestore(uid)
      ]);
      setSavedFormulas(formulas);
      setSavedOrders(orders);
    } catch (err) {
      console.error("Failed to load firestore user data:", err);
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const user = await signUpWithEmail(email, password, displayName);
      await saveUserProfile(user);
      onUserChanged(user, null);
      setSuccessMsg("Welcome to the Atelier! Your account was created successfully.");
      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to register.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const user = await signInWithEmail(email, password);
      await saveUserProfile(user);
      onUserChanged(user, null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        await saveUserProfile(result.user);
        onUserChanged(result.user, result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await googleSignOut();
      onUserChanged(null, null);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFormula = async (formulaId: string) => {
    if (!currentUser) return;
    if (confirm("Are you sure you want to delete this formula from your collection?")) {
      try {
        await deleteFormulaFromFirestore(formulaId);
        await loadUserData(currentUser.uid);
      } catch (err) {
        console.error(err);
        alert("Failed to delete formula.");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div id="auth-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-[#111112] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col md:flex-row"
        >
          {/* Aesthetic Luxury Brand Panel */}
          <div className="relative md:w-5/12 bg-black flex flex-col justify-between p-8 text-white border-r border-white/5 overflow-hidden min-h-[220px] md:min-h-auto">
            {/* Ambient gold glow decoration */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#fed65b]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="text-[#fed65b] stroke-1" size={18} />
                <span className="font-mono text-[10px] tracking-[0.3em] text-[#fed65b] uppercase">AETHERIA</span>
              </div>
              <h2 className="text-3xl font-light tracking-tight text-white mb-2 leading-tight">
                The Atelier Lounge
              </h2>
              <p className="text-xs text-white/50 font-light leading-relaxed">
                Step into a sensory haven. Gain exclusive access to curated olfactory archives, log custom extractions, and preserve formulation memories forever.
              </p>
            </div>

            <div className="mt-8">
              <p className="text-[9px] font-mono tracking-widest text-white/30 uppercase">
                Est. 2026 // Fine French Custom Scent House
              </p>
            </div>
          </div>

          {/* Core Sign-In / Dashboard Panel */}
          <div className="flex-1 p-8 flex flex-col justify-between overflow-y-auto max-h-[70vh] md:max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/40 hover:text-white rounded-full hover:bg-white/5 transition-colors"
              aria-label="Close panel"
            >
              <X size={16} />
            </button>

            {currentUser ? (
              /* DASHBOARD VIEW (WHEN SIGNED IN) */
              <div className="space-y-6">
                {/* Profile Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#fed65b]/20 flex items-center justify-center text-[#fed65b] font-bold uppercase overflow-hidden border border-white/10">
                      {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        currentUser.displayName ? currentUser.displayName[0] : 'U'
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-light text-white leading-tight">
                        Bonjour, {currentUser.displayName || "Atelier Member"}
                      </h3>
                      <p className="text-xs text-white/40 font-mono mt-0.5">{currentUser.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 border border-white/10 hover:border-red-950 hover:bg-red-950/20 hover:text-red-300 px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all duration-300"
                  >
                    <LogOut size={12} />
                    Sign Out
                  </button>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Custom Scent Formulary */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-[#fed65b] flex items-center gap-1.5">
                      <Sparkles size={12} />
                      Your Formulary ({savedFormulas.length})
                    </h4>

                    {isDataLoading ? (
                      <div className="py-12 text-center text-xs font-mono text-white/40">
                        Synchronizing archives...
                      </div>
                    ) : savedFormulas.length === 0 ? (
                      <div className="p-6 bg-white/[0.02] border border-white/5 rounded-xl text-center text-xs text-white/40 font-light italic">
                        No formulas recorded. Head to "The Finder" to synthesize your bespoke bottle, and click "Sync Formula"!
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {savedFormulas.map((formula, idx) => (
                          <div 
                            key={idx} 
                            className="p-3 bg-white/[0.02] border border-white/5 rounded-lg flex justify-between items-start gap-4 hover:border-white/10 transition-colors"
                          >
                            <div className="space-y-1 min-w-0">
                              <span className="text-xs text-[#fed65b] font-medium block truncate">{formula.name}</span>
                              <p className="text-[10px] text-white/40 font-mono leading-none">{formula.vibe}</p>
                              <p className="text-[10px] text-white/60 font-light leading-tight line-clamp-2 mt-1">
                                {formula.description}
                              </p>
                              <div className="flex gap-2 pt-1.5 flex-wrap">
                                <span className="px-1.5 py-0.5 bg-white/5 rounded text-[8px] font-mono text-white/50">Top: {formula.topNotes}</span>
                                <span className="px-1.5 py-0.5 bg-white/5 rounded text-[8px] font-mono text-white/50">Heart: {formula.heartNotes}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteFormula(formula.formulaId)}
                              className="text-white/30 hover:text-red-400 p-1.5 rounded-md hover:bg-red-950/20 transition-colors shrink-0"
                              title="Delete formula"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Historical Orders */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-white flex items-center gap-1.5">
                      <Clock size={12} />
                      Order History ({savedOrders.length})
                    </h4>

                    {isDataLoading ? (
                      <div className="py-12 text-center text-xs font-mono text-white/40">
                        Retrieving orders...
                      </div>
                    ) : savedOrders.length === 0 ? (
                      <div className="p-6 bg-white/[0.02] border border-white/5 rounded-xl text-center text-xs text-white/40 font-light italic">
                        No orders recorded. Check out items from your cart to log them into Firestore.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {savedOrders.map((order, idx) => (
                          <div 
                            key={idx} 
                            className="p-3 bg-white/[0.02] border border-white/5 rounded-lg space-y-1.5 hover:border-white/10 transition-colors"
                          >
                            <div className="flex justify-between text-[10px] font-mono">
                              <span className="text-[#fed65b]">{order.orderId}</span>
                              <span className="text-white/40">{order.date}</span>
                            </div>
                            <div className="flex justify-between items-end">
                              <div>
                                <span className="text-xs font-light text-white block">{order.productName} ({order.size})</span>
                                <span className="text-[10px] text-white/40 font-light">Qty: {order.quantity} • {order.type}</span>
                              </div>
                              <span className="text-xs font-medium text-white">{order.pricePaid}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* AUTH FORMS (WHEN SIGNED OUT) */
              <div className="space-y-6">
                {/* Form Tabs */}
                <div className="flex border-b border-white/10 font-mono text-xs">
                  <button
                    onClick={() => { setActiveTab('signin'); setError(null); }}
                    className={`flex-1 py-2.5 font-medium border-b-2 tracking-wider transition-all uppercase ${
                      activeTab === 'signin' ? 'border-[#fed65b] text-white' : 'border-transparent text-white/40 hover:text-white/80'
                    }`}
                  >
                    MEMBER SIGN IN
                  </button>
                  <button
                    onClick={() => { setActiveTab('signup'); setError(null); }}
                    className={`flex-1 py-2.5 font-medium border-b-2 tracking-wider transition-all uppercase ${
                      activeTab === 'signup' ? 'border-[#fed65b] text-white' : 'border-transparent text-white/40 hover:text-white/80'
                    }`}
                  >
                    CREATE ACCOUNT
                  </button>
                </div>

                {/* Messages */}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 bg-red-950/30 border border-red-900/40 rounded-xl text-xs text-red-300 font-mono flex items-start gap-2"
                  >
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {successMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 bg-green-950/30 border border-green-900/40 rounded-xl text-xs text-green-300 font-mono flex items-start gap-2"
                  >
                    <CheckCircle size={14} className="shrink-0 mt-0.5 text-green-400" />
                    <span>{successMsg}</span>
                  </motion.div>
                )}

                {/* Main Auth Form */}
                <form onSubmit={activeTab === 'signin' ? handleEmailSignIn : handleEmailSignUp} className="space-y-4">
                  {activeTab === 'signup' && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-white/40">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                        <input
                          type="text"
                          required
                          placeholder="Jean-Baptiste Grenouille"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#fed65b] focus:bg-white/[0.08] transition-all font-light"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-white/40">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                      <input
                        type="email"
                        required
                        placeholder="perfumer@aetheria.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#fed65b] focus:bg-white/[0.08] transition-all font-light"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-white/40">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#fed65b] focus:bg-white/[0.08] transition-all font-light"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-white hover:bg-neutral-200 text-black py-3.5 font-mono text-xs uppercase tracking-widest font-semibold transition-all duration-300 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 select-none cursor-pointer"
                  >
                    {isLoading ? "Synchronizing..." : activeTab === 'signin' ? "Enter the Atelier" : "Forge Account"}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/5"></div>
                  <span className="flex-shrink mx-4 text-[9px] font-mono text-white/20 uppercase tracking-widest">or continue with</span>
                  <div className="flex-grow border-t border-white/5"></div>
                </div>

                {/* Google SSO Button */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full border border-white/10 hover:border-white/30 hover:bg-white/5 text-white py-3 font-mono text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 select-none cursor-pointer"
                >
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>Connect with Google</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
