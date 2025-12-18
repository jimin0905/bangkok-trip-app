import firebase from "firebase/compat/app";
import "firebase/compat/database";
import "firebase/compat/auth";
import { Expense } from "../types";

// ==========================================
// Firebase Config Initialization
// ==========================================

let firebaseConfig = null;
let rawConfig = '';

// 1. Try to get VITE_FIREBASE_CONFIG statically
try {
    // @ts-ignore
    if (import.meta.env && import.meta.env.VITE_FIREBASE_CONFIG) {
        // @ts-ignore
        rawConfig = import.meta.env.VITE_FIREBASE_CONFIG;
    }
} catch (e) {}

// 2. Fallback to process.env
if (!rawConfig && typeof process !== 'undefined' && process.env) {
    rawConfig = process.env.VITE_FIREBASE_CONFIG || process.env.FIREBASE_CONFIG || '';
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
    // @ts-ignore
    const apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || 
                   (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_API_KEY);
                   
    if (apiKey) {
        const getVar = (key: string) => {
            // @ts-ignore
            return (typeof import.meta !== 'undefined' && import.meta.env?.[`VITE_${key}`]) || 
                   (typeof process !== 'undefined' && (process.env?.[`VITE_${key}`] || process.env?.[key]));
        };

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

// Initialization Logic (Namespace API for compat/v8)
let app: firebase.app.App;
let db: firebase.database.Database;
let auth: firebase.auth.Auth;
let isInitialized = false;

try {
    if (firebaseConfig && (firebaseConfig.apiKey || firebaseConfig.databaseURL)) {
        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
        } else {
            app = firebase.app();
        }
        db = firebase.database();
        auth = firebase.auth();
        isInitialized = true;
    } else {
        console.warn("Firebase configuration missing or invalid. Sync disabled.");
    }
} catch (e) {
    console.error("Firebase initialization failed:", e);
}

// 監聽驗證狀態 (Debug purpose)
if (isInitialized && auth!) {
    auth.onAuthStateChanged((user) => {
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
        const userCredential = await auth.signInAnonymously();
        console.log("✅ Identity Verified! UID:", userCredential.user.uid);
        return userCredential.user;
    } catch (error: any) {
        if (error.code === 'auth/operation-not-allowed') {
            console.error("❌ CRITICAL ERROR: Anonymous auth is disabled in Firebase Console.");
            console.error("👉 Please go to Firebase Console -> Authentication -> Sign-in method -> Enable Anonymous.");
            alert("請至 Firebase Console 啟用「匿名登入 (Anonymous Auth)」，否則無法同步資料。");
        } else {
            console.error("❌ Authentication Failed:", error);
        }
        throw error;
    }
};

// Generate a secure SHA-256 path
const getSecurePath = async (groupId: string, pin: string) => {
    if (!groupId || !pin) throw new Error("ID and PIN required");
    
    const raw = `${groupId.trim()}_${pin.trim()}_BKK_SECRET_SALT`;
    const msgBuffer = new TextEncoder().encode(raw);
    
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return `trips/${hashHex}/expenses`;
    } else {
        let hash = 0;
        for (let i = 0; i < raw.length; i++) {
            const char = raw.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `trips/insecure_${Math.abs(hash)}/expenses`;
    }
};

export const syncService = {
    isReady: () => isInitialized,

    // Returns a PROMISE that resolves to the unsubscribe function
    subscribe: async (groupId: string, pin: string, onStatus: (status: string) => void, callback: (data: Expense[]) => void) => {
        if (!isInitialized) {
            console.warn("Sync attempted but Firebase not ready.");
            return () => {};
        }

        try {
            // 1. 驗證階段 (程式自動執行)
            onStatus("🔒 正在驗證身份...");
            await ensureAuth(); 

            // 2. 加密路徑計算
            const path = await getSecurePath(groupId, pin);
            const expensesRef = db.ref(path);
            
            // 3. 資料同步
            onStatus("☁️ 正在下載資料...");
            
            const listener = expensesRef.on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const list = Object.values(data) as Expense[];
                    list.sort((a, b) => b.timestamp - a.timestamp);
                    callback(list);
                } else {
                    callback([]);
                }
                onStatus(""); // 完成
            }, (error) => {
                console.error("Sync Error:", error);
                if (error.message.includes("permission_denied")) {
                    onStatus("❌ 權限不足 (請檢查資料庫規則)");
                } else {
                    onStatus("❌ 連線錯誤");
                }
            });

            return () => expensesRef.off('value', listener);
        } catch (e) {
            console.error("Setup failed:", e);
            onStatus("❌ 驗證失敗 (請看 Console)");
            return () => {};
        }
    },

    addExpense: async (groupId: string, pin: string, expense: Expense) => {
        if (!isInitialized) return;
        await ensureAuth();
        const path = await getSecurePath(groupId, pin);
        await db.ref(`${path}/${expense.id}`).set(expense);
    },

    deleteExpense: async (groupId: string, pin: string, expenseId: string) => {
        if (!isInitialized) return;
        await ensureAuth();
        const path = await getSecurePath(groupId, pin);
        await db.ref(`${path}/${expenseId}`).remove();
    },

    settleExpenses: async (groupId: string, pin: string, expenseIds: string[]) => {
        if (!isInitialized) return;
        await ensureAuth();
        const path = await getSecurePath(groupId, pin);
        const updates: Record<string, any> = {};
        
        expenseIds.forEach(id => {
            updates[`${path}/${id}/isSettled`] = true;
        });

        await db.ref().update(updates);
    }
};