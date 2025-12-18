import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, remove, set, update, Database } from "firebase/database";
import { Expense } from "../types";

// ==========================================
// Firebase Config Initialization
// ==========================================

let firebaseConfig = null;
let rawConfig = '';

// Helper to safely get env vars
const getEnv = (key: string) => {
    // 1. Try standard process.env (Node/Webpack/Vite with define)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
    }
    // 2. Try Vite's import.meta.env
    try {
        // @ts-ignore
        if (import.meta && import.meta.env && import.meta.env[key]) {
             // @ts-ignore
             return import.meta.env[key];
        }
    } catch (e) {}
    return null;
};

// Try to find the config string
rawConfig = getEnv('FIREBASE_CONFIG') || getEnv('VITE_FIREBASE_CONFIG') || '';

if (rawConfig) {
    try {
        // Clean up the string if it has wrapping quotes (common .env issue)
        let cleanConfig = rawConfig.trim();
        if (cleanConfig.startsWith("'") && cleanConfig.endsWith("'")) {
            cleanConfig = cleanConfig.slice(1, -1);
        }
        if (cleanConfig.startsWith('"') && cleanConfig.endsWith('"')) {
            cleanConfig = cleanConfig.slice(1, -1);
        }
        
        firebaseConfig = JSON.parse(cleanConfig);
        console.log("Firebase config parsed successfully.");
    } catch (e) {
        console.error("Firebase Config Error: Failed to parse JSON.", e);
        console.error("Raw Config received:", rawConfig); // Help user debug
    }
} else {
    // Fallback: Check individual fields
    const apiKey = getEnv('FIREBASE_API_KEY') || getEnv('VITE_FIREBASE_API_KEY');
    if (apiKey) {
        firebaseConfig = {
            apiKey: apiKey,
            authDomain: getEnv('FIREBASE_AUTH_DOMAIN') || getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
            databaseURL: getEnv('FIREBASE_DATABASE_URL') || getEnv('VITE_FIREBASE_DATABASE_URL'),
            projectId: getEnv('FIREBASE_PROJECT_ID') || getEnv('VITE_FIREBASE_PROJECT_ID'),
            storageBucket: getEnv('FIREBASE_STORAGE_BUCKET') || getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
            messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID') || getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
            appId: getEnv('FIREBASE_APP_ID') || getEnv('VITE_FIREBASE_APP_ID')
        };
    }
}

let app;
let db: Database;
let isInitialized = false;

try {
    if (firebaseConfig && (firebaseConfig.apiKey || firebaseConfig.databaseURL)) {
        app = initializeApp(firebaseConfig);
        db = getDatabase(app);
        isInitialized = true;
    } else {
        console.warn("Firebase configuration missing or invalid. Sync disabled.");
    }
} catch (e) {
    console.error("Firebase initialization failed:", e);
}

// Generate a secure-ish path based on Group ID and PIN
const getPath = (groupId: string, pin: string) => {
    const raw = `${groupId.trim()}_${pin.trim()}`;
    // Simple hash to avoid plain text paths
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        const char = raw.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    // Use a clean alphanumeric string
    const safeHash = Math.abs(hash).toString(36) + raw.length.toString(36);
    return `trips/${safeHash}/expenses`;
};

export const syncService = {
    isReady: () => isInitialized,

    subscribe: (groupId: string, pin: string, callback: (data: Expense[]) => void) => {
        if (!isInitialized) {
            console.warn("Sync attempted but Firebase not ready.");
            return () => {};
        }
        
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