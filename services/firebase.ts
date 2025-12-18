import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, remove, set, update, Database } from "firebase/database";
import { Expense } from "../types";

// ==========================================
// Firebase Config Initialization
// Supports simplified setup via a single JSON string
// ==========================================

let firebaseConfig = null;

// Option 1: Try parsing the single JSON string (Easiest for Vercel)
if (process.env.FIREBASE_CONFIG) {
    try {
        firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
    } catch (e) {
        console.error("Failed to parse FIREBASE_CONFIG environment variable.");
    }
}

// Option 2: Fallback to individual variables if JSON is not present
if (!firebaseConfig) {
    firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID
    };
}

let app;
let db: Database;
let isInitialized = false;

// Initialize conditionally to avoid errors if config is missing
try {
    // Basic check: databaseURL is the most critical for this app
    if (firebaseConfig && (firebaseConfig.apiKey || firebaseConfig.databaseURL)) {
        app = initializeApp(firebaseConfig);
        db = getDatabase(app);
        isInitialized = true;
    } else {
        console.warn("Firebase configuration not found. Sync disabled.");
    }
} catch (e) {
    console.error("Firebase init failed:", e);
}

// Generate a secure-ish path based on Group ID and PIN
const getPath = (groupId: string, pin: string) => {
    const raw = `${groupId.trim()}_${pin.trim()}`;
    const hash = btoa(encodeURIComponent(raw)); 
    return `trips/${hash}/expenses`;
};

export const syncService = {
    isReady: () => isInitialized,

    subscribe: (groupId: string, pin: string, callback: (data: Expense[]) => void) => {
        if (!isInitialized) return () => {};
        
        const expensesRef = ref(db, getPath(groupId, pin));
        
        const unsubscribe = onValue(expensesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.values(data) as Expense[];
                list.sort((a, b) => b.timestamp - a.timestamp);
                callback(list);
            } else {
                callback([]);
            }
        });

        return unsubscribe;
    },

    addExpense: (groupId: string, pin: string, expense: Expense) => {
        if (!isInitialized) return;
        set(ref(db, `${getPath(groupId, pin)}/${expense.id}`), expense);
    },

    deleteExpense: (groupId: string, pin: string, expenseId: string) => {
        if (!isInitialized) return;
        const itemRef = ref(db, `${getPath(groupId, pin)}/${expenseId}`);
        remove(itemRef);
    },

    settleExpenses: (groupId: string, pin: string, expenseIds: string[]) => {
        if (!isInitialized) return;
        const basePath = getPath(groupId, pin);
        const updates: Record<string, any> = {};
        
        expenseIds.forEach(id => {
            updates[`${basePath}/${id}/isSettled`] = true;
        });

        update(ref(db), updates);
    }
};