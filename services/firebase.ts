
import { initializeApp, FirebaseApp } from "firebase/app";
import { getDatabase, ref, set, remove, update, onValue, off, Database } from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged, Auth } from "firebase/auth";
import { Expense, UserProfile } from "../types";

// ==========================================
// Firebase Config Initialization
// ==========================================

let firebaseConfig: any = null;
let rawConfig = '';

// 1. Try to get VITE_FIREBASE_CONFIG safely
try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_CONFIG) {
        // @ts-ignore
        rawConfig = import.meta.env.VITE_FIREBASE_CONFIG;
    }
} catch (e) {}

// 2. Fallback to process.env safely
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
            console.log("Standard JSON parse failed, attempting relaxed parse...");
            const relaxed = cleanConfig.replace(/([{,]\s*)([a-zA-Z0-9_]+?)\s*:/g, '$1"$2":');
            firebaseConfig = JSON.parse(relaxed);
        }
    } catch (e) {
        console.error("Firebase Config Error: Failed to parse JSON.", e);
    }
} else {
    // Fallback: Check individual fields
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

// Initialization Logic (Modular API)
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
    } else {
        console.warn("Firebase configuration missing or invalid. Sync disabled.");
    }
} catch (e) {
    console.error("Firebase initialization failed:", e);
}

// 監聽驗證狀態 (Debug purpose)
if (isInitialized && auth) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log(`🔥 Firebase Auth Active: User is verified. (UID: ${user.uid.substring(0, 5)}...)`);
        } else {
            console.log("💤 Firebase Auth: User is signed out.");
        }
    });
}

// Ensure user is signed in (Anonymously) before doing DB operations
const ensureAuth = async () => {
    if (!isInitialized || !auth) throw new Error("Firebase not initialized");
    
    if (auth.currentUser) return auth.currentUser;
    
    try {
        console.log("🔒 Verifying identity with Firebase (Anonymous Auth)...");
        const userCredential = await signInAnonymously(auth);
        console.log("✅ Identity Verified! UID:", userCredential.user.uid);
        return userCredential.user;
    } catch (error: any) {
        if (error.code === 'auth/operation-not-allowed') {
            console.error("❌ CRITICAL ERROR: Anonymous auth is disabled in Firebase Console.");
            alert("請至 Firebase Console 啟用「匿名登入 (Anonymous Auth)」，否則無法同步資料。");
        } else {
            console.error("❌ Authentication Failed:", error);
        }
        throw error;
    }
};

// Generate a secure SHA-256 base path for the trip
const getSecureBasePath = async (groupId: string, pin: string) => {
    if (!groupId || !pin) throw new Error("ID and PIN required");
    
    const raw = `${groupId.trim()}_${pin.trim()}_BKK_SECRET_SALT`;
    const msgBuffer = new TextEncoder().encode(raw);
    
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return `trips/${hashHex}`; // Base path
    } else {
        let hash = 0;
        for (let i = 0; i < raw.length; i++) {
            const char = raw.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `trips/insecure_${Math.abs(hash)}`; // Base path
    }
};

export const syncService = {
    isReady: () => isInitialized,

    // Returns a PROMISE that resolves to the unsubscribe function
    // Subscribes to the WHOLE trip node (expenses + users)
    subscribe: async (
        groupId: string, 
        pin: string, 
        onStatus: (status: string) => void, 
        callback: (data: { expenses: Expense[], users: UserProfile[] }) => void
    ) => {
        if (!isInitialized || !db) {
            console.warn("Sync attempted but Firebase not ready.");
            return () => {};
        }

        try {
            // 1. 驗證階段
            onStatus("🔒 正在驗證身份...");
            await ensureAuth(); 

            // 2. 加密路徑計算
            const path = await getSecureBasePath(groupId, pin);
            const tripRef = ref(db, path);
            
            // 3. 資料同步 (Listen to root of trip)
            onStatus("☁️ 正在下載資料...");
            
            const unsubscribe = onValue(tripRef, (snapshot) => {
                const val = snapshot.val() || {};
                
                // Parse Expenses
                const expensesObj = val.expenses || {};
                const expenseList = Object.values(expensesObj) as Expense[];
                expenseList.sort((a, b) => b.timestamp - a.timestamp);

                // Parse Users
                const usersList = (val.users as UserProfile[]) || [];

                callback({ expenses: expenseList, users: usersList });
                onStatus(""); // 完成
            }, (error) => {
                console.error("Sync Error:", error);
                if (error.message.includes("permission_denied")) {
                    onStatus("❌ 權限不足 (請檢查DB規則)");
                } else {
                    onStatus("❌ 連線錯誤");
                }
            });

            return () => off(tripRef, 'value', unsubscribe);
        } catch (e) {
            console.error("Setup failed:", e);
            onStatus("❌ 驗證失敗 (請看 Console)");
            return () => {};
        }
    },

    addExpense: async (groupId: string, pin: string, expense: Expense) => {
        if (!isInitialized || !db) return;
        await ensureAuth();
        const path = await getSecureBasePath(groupId, pin);
        const itemRef = ref(db, `${path}/expenses/${expense.id}`);
        await set(itemRef, expense);
    },

    // Same as add, but syntactically separated for clarity in UI code
    updateExpense: async (groupId: string, pin: string, expense: Expense) => {
        if (!isInitialized || !db) return;
        await ensureAuth();
        const path = await getSecureBasePath(groupId, pin);
        const itemRef = ref(db, `${path}/expenses/${expense.id}`);
        await set(itemRef, expense);
    },

    deleteExpense: async (groupId: string, pin: string, expenseId: string) => {
        if (!isInitialized || !db) return;
        await ensureAuth();
        const path = await getSecureBasePath(groupId, pin);
        const itemRef = ref(db, `${path}/expenses/${expenseId}`);
        await remove(itemRef);
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
        const usersRef = ref(db, `${path}/users`);
        await set(usersRef, users);
    }
};