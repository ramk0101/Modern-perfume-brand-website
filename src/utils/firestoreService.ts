import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where 
} from "firebase/firestore";
import { db, auth } from "./firebaseAuth";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 1. Profile management
export const saveUserProfile = async (user: any) => {
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      const payload = {
        uid: user.uid,
        displayName: user.displayName || "Atelier Member",
        email: user.email || "",
        createdAt: new Date().toISOString()
      };
      await setDoc(userRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// 2. Orders Sync
export const saveOrderToFirestore = async (order: {
  orderId: string;
  userId: string;
  date: string;
  type: string;
  productName: string;
  size: string;
  quantity: number;
  pricePaid: string;
  currency: string;
  status: string;
  customerName: string;
  address: string;
}) => {
  const path = `orders/${order.orderId}`;
  try {
    const orderRef = doc(db, "orders", order.orderId);
    await setDoc(orderRef, order);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const fetchOrdersFromFirestore = async (userId: string) => {
  const path = "orders";
  try {
    const q = query(collection(db, "orders"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const orders: any[] = [];
    querySnapshot.forEach((doc) => {
      orders.push(doc.data());
    });
    // Sort by date descending
    return orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

// 3. Custom Formulation Sync
export const saveFormulaToFirestore = async (formula: {
  formulaId: string;
  userId: string;
  name: string;
  date: string;
  description: string;
  vibe: string;
  intensity: string;
  topNotes: string;
  heartNotes: string;
  baseNotes: string;
  matchScore: string;
}) => {
  const path = `formulas/${formula.formulaId}`;
  try {
    const formulaRef = doc(db, "formulas", formula.formulaId);
    await setDoc(formulaRef, formula);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const fetchFormulasFromFirestore = async (userId: string) => {
  const path = "formulas";
  try {
    const q = query(collection(db, "formulas"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const formulas: any[] = [];
    querySnapshot.forEach((doc) => {
      formulas.push(doc.data());
    });
    return formulas.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const deleteFormulaFromFirestore = async (formulaId: string) => {
  const path = `formulas/${formulaId}`;
  try {
    // We import deleteDoc dynamically to keep things compact
    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "formulas", formulaId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};
