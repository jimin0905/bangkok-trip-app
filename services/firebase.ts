
import { initializeApp, FirebaseApp } from "firebase/app";
import { getDatabase, ref, set, remove, update, onValue, off, Database } from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged, Auth } from "firebase/auth";
import { Expense, UserProfile, TripSettings } from "../types";

// ==========================================
// Firebase Config Initialization
// ==========================================

let firebaseConfig: any = null;
let rawConfig = '';

try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_CONFIG) {
        // @ts-ignore
        rawConfig = import.meta.env.VITE_FIREBASE_CONFIG;
    }
} catch (e) {}

if (!rawConfig) {
    try {
        if (typeof process !== 'undefined' && process.env) {
            rawConfig = process.env.VITE_FIREBASE_CONFIG || process.env.FIREBASE_CONFIG || '';
        }
    } catch (e) {}
}

if (rawConfig) {
    try {
        let cleanConfig = rawConfig.trim();
        if ((cleanConfig.startsWith("'") && cleanConfig.endsWith("'")) || 
            (cleanConfig.startsWith('"') && cleanConfig.endsWith('"'))) {
            cleanConfig = cleanConfig.slice(1, -1);
        }

        try {
            firebaseConfig = JSON.parse(cleanConfig);
        } catch (jsonError) {
            const relaxed = cleanConfig.replace(/([{,]\s*)([a-zA-Z0-9_]+?)\s*:/g, '$1"$2":');
            firebaseConfig = JSON.parse(relaxed);
        }
    } catch (e) {
        console.error("Firebase Config Error: Failed to parse JSON.", e);
    }
} else {
    const getVar = (key: string) => {
        try {
            // @ts-ignore
            if (typeof import.meta !== 'undefined' && import.meta.env?.[`VITE_${key}`]) return import.meta.env[`VITE_${key}`];
            // @ts-ignore
            if (typeof process !== 'undefined' && process.env?.[`VITE_${key}`]) return process.env[`VITE_${key}`];
            // @ts-ignore
            if (typeof process !== 'undefined' && process.env?.[key]) return process.env[key];
        } catch(e) {}
        return undefined;
    };

    const apiKey = getVar('FIREBASE_API_KEY');
    if (apiKey) {
        firebaseConfig = {
            apiKey: apiKey,
            authDomain: getVar('FIREBASE_AUTH_DOMAIN'),
            databaseURL: getVar('FIREBASE_DATABASE_URL'),
            projectId: getVar('FIREBASE_PROJECT_ID'),
            storageBucket: getVar('FIREBASE_STORAGE_BUCKET'),
            messagingSenderId: getVar('FIREBASE_MESSAGING_SENDER_ID'),
            appId: getVar('FIREBASE_APP_ID')
        };
    }
}

let app: FirebaseApp | undefined;
let db: Database | undefined;
let auth: Auth | undefined;
let isInitialized = false;

try {
    if (firebaseConfig && (firebaseConfig.apiKey || firebaseConfig.databaseURL)) {
        app = initializeApp(firebaseConfig);
        db = getDatabase(app);
        auth = getAuth(app);
        isInitialized = true;
    }
} catch (e) {
    console.error("Firebase initialization failed:", e);
}

const ensureAuth = async () => {
    if (!isInitialized || !auth) throw new Error("Firebase not initialized");
    if (auth.currentUser) return auth.currentUser;
    try {
        const userCredential = await signInAnonymously(auth);
        return userCredential.user;
    } catch (error: any) {
        throw error;
    }
};

const getSecureBasePath = async (groupId: string, pin: string) => {
    if (!groupId || !pin) throw new Error("ID and PIN required");
    const raw = `${groupId.trim()}_${pin.trim()}_BKK_SECRET_SALT`;
    const msgBuffer = new TextEncoder().encode(raw);
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return `trips/${hashHex}`;
    } else {
        let hash = 0;
        for (let i = 0; i < raw.length; i++) {
            const char = raw.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `trips/insecure_${Math.abs(hash)}`;
    }
};

export const syncService = {
    isReady: () => isInitialized,

    subscribe: async (
        groupId: string, 
        pin: string, 
        onStatus: (status: string) => void, 
        callback: (data: { expenses: Expense[], users: UserProfile[], settings?: TripSettings }) => void
    ) => {
        if (!isInitialized || !db) return () => {};

        try {
            onStatus("🔒 驗證中...");
            await ensureAuth(); 

            const path = await getSecureBasePath(groupId, pin);
            const tripRef = ref(db, path);
            
            onStatus("☁️ 同步中...");
            
            const unsubscribe = onValue(tripRef, (snapshot) => {
                const val = snapshot.val() || {};
                
                const expensesObj = val.expenses || {};
                const expenseList = Object.values(expensesObj) as Expense[];
                expenseList.sort((a, b) => b.timestamp - a.timestamp);

                const usersList = (val.users as UserProfile[]) || [];
                const settings = val.settings as TripSettings | undefined;

                callback({ expenses: expenseList, users: usersList, settings });
                onStatus("");
            }, (error) => {
                onStatus("❌ 連線錯誤");
            });

            return () => off(tripRef, 'value', unsubscribe);
        } catch (e) {
            onStatus("❌ 驗證失敗");
            return () => {};
        }
    },

    addExpense: async (groupId: string, pin: string, expense: Expense) => {
        if (!isInitialized || !db) return;
        await ensureAuth();
        const path = await getSecureBasePath(groupId, pin);
        await set(ref(db, `${path}/expenses/${expense.id}`), expense);
    },

    updateExpense: async (groupId: string, pin: string, expense: Expense) => {
        if (!isInitialized || !db) return;
        await ensureAuth();
        const path = await getSecureBasePath(groupId, pin);
        await set(ref(db, `${path}/expenses/${expense.id}`), expense);
    },

    deleteExpense: async (groupId: string, pin: string, expenseId: string) => {
        if (!isInitialized || !db) return;
        await ensureAuth();
        const path = await getSecureBasePath(groupId, pin);
        await remove(ref(db, `${path}/expenses/${expenseId}`));
    },

    settleExpenses: async (groupId: string, pin: string, expenseIds: string[]) => {
        if (!isInitialized || !db) return;
        await ensureAuth();
        const path = await getSecureBasePath(groupId, pin);
        const updates: Record<string, any> = {};
        expenseIds.forEach(id => {
            updates[`${path}/expenses/${id}/isSettled`] = true;
        });
        await update(ref(db), updates);
    },

    updateUsers: async (groupId: string, pin: string, users: UserProfile[]) => {
        if (!isInitialized || !db) return;
        await ensureAuth();
        const path = await getSecureBasePath(groupId, pin);
        await set(ref(db, `${path}/users`), users);
    },

    updateSettings: async (groupId: string, pin: string, settings: TripSettings) => {
        if (!isInitialized || !db) return;
        await ensureAuth();
        const path = await getSecureBasePath(groupId, pin);
        await set(ref(db, `${path}/settings`), settings);
    }
};
