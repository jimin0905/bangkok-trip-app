
import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, Plus, X, Trash2, ShoppingBag, Utensils, Bus, MoreHorizontal, Cloud, CloudOff, LogOut, LogIn, User, CheckCircle2, ArrowRightLeft, Users, Settings, UserPlus, MinusCircle, Loader2, ListFilter, ChevronUp, ChevronDown, Calendar, CalendarDays, Pencil } from 'lucide-react';
import { Expense, UserProfile } from '../types';
import { syncService } from '../services/firebase';

const CATEGORIES = [
  { id: 'food', label: '餐飲', icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'shopping', label: '購物', icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'transport', label: '交通', icon: Bus, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'other', label: '其他', icon: MoreHorizontal, color: 'text-gray-600', bg: 'bg-gray-50' },
] as const;

// Helper: Get today in YYYY-MM-DD local time
const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper: Calculate Trip Day ID (1-6) from date string. Returns 0 if outside trip.
const getTripDayId = (dateStr: string): number => {
    const start = new Date('2025-12-24T00:00:00+07:00'); // Bangkok Timeish approximation
    const [y, m, d] = dateStr.split('-').map(Number);
    const target = new Date(y, m - 1, d); // Local midnight
    const startLocal = new Date(2025, 11, 24); // 2025-12-24 Local midnight
    
    const diffTime = target.getTime() - startLocal.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0 && diffDays <= 5) return diffDays + 1;
    return 0;
};

interface Props {
    isOpen: boolean;
    onRequestOpen: () => void;
    onRequestClose: () => void;
}

const ExpenseTracker: React.FC<Props> = ({ isOpen, onRequestOpen, onRequestClose }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // Dynamic Users State
  const [users, setUsers] = useState<UserProfile[]>([{ id: 'u1', name: '我' }]);
  const [showUserManage, setShowUserManage] = useState(false);
  const [newUserName, setNewUserName] = useState('');

  // Sync State
  const [isSyncMode, setIsSyncMode] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [groupId, setGroupId] = useState('');
  const [pin, setPin] = useState('');
  const [tempGroupId, setTempGroupId] = useState('');
  const [tempPin, setTempPin] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [firebaseError, setFirebaseError] = useState(false);

  // Form State
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // Track if editing
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('food');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString()); 
  const [payer, setPayer] = useState<string>('u1'); 
  const [splitType, setSplitType] = useState<'split' | 'self'>('split');

  // Filter State
  const [filterDate, setFilterDate] = useState<string | 'all'>('all');
  const [filterPayer, setFilterPayer] = useState<string | 'all'>('all');

  // Initialize
  useEffect(() => {
    if (!syncService.isReady()) setFirebaseError(true);
    
    const savedLocal = localStorage.getItem('bkk_expenses_2025');
    if (savedLocal) {
        try { setExpenses(JSON.parse(savedLocal)); } catch (e) { console.error(e); }
    }

    const savedUsers = localStorage.getItem('bkk_users_2025');
    if (savedUsers) {
        try { 
            const parsed = JSON.parse(savedUsers);
            if (Array.isArray(parsed) && parsed.length > 0) {
                setUsers(parsed);
                if (parsed.length > 0) setPayer(parsed[0].id);
            }
        } catch (e) {}
    }

    const savedSession = localStorage.getItem('bkk_sync_session');
    if (savedSession) {
        try {
            const { g, p } = JSON.parse(savedSession);
            if (g && p) {
                setGroupId(g);
                setPin(p);
                setTempGroupId(g);
                setTempPin(p);
                setIsSyncMode(true);
            }
        } catch (e) {}
    }
  }, []);

  // Sync Subscription
  useEffect(() => {
    let unsubscribe = () => {};
    let isMounted = true;

    const setupSync = async () => {
        if (isSyncMode && groupId && pin && syncService.isReady()) {
            setConnectionStatus('啟動中...');
            try {
                const unsub = await syncService.subscribe(
                    groupId, 
                    pin, 
                    (status) => { if (isMounted) setConnectionStatus(status); },
                    (data) => {
                        if (isMounted) {
                            setExpenses(data.expenses);
                            if (data.users && data.users.length > 0) setUsers(data.users);
                            setConnectionStatus(prev => prev.includes('❌') ? prev : '');
                        }
                    }
                );
                if (isMounted) unsubscribe = unsub;
            } catch (e) {
                console.error("Sync failed", e);
                if (isMounted) setConnectionStatus('❌ 連線失敗');
            }
        } else {
            setConnectionStatus('');
        }
    };

    setupSync();
    return () => { isMounted = false; if (unsubscribe) unsubscribe(); };
  }, [isSyncMode, groupId, pin]);

  // Local Storage Saver
  useEffect(() => {
    if (!isSyncMode) localStorage.setItem('bkk_expenses_2025', JSON.stringify(expenses));
    localStorage.setItem('bkk_users_2025', JSON.stringify(users));
  }, [expenses, users, isSyncMode]);

  const handleLogin = () => {
      if (!tempGroupId || !tempPin) return;
      setGroupId(tempGroupId);
      setPin(tempPin);
      setIsSyncMode(true);
      setShowAuth(false);
      localStorage.setItem('bkk_sync_session', JSON.stringify({ g: tempGroupId, p: tempPin }));
  };

  const handleLogout = () => {
      if (!window.confirm("確定要登出同步模式嗎？")) return;
      setIsSyncMode(false);
      setGroupId('');
      setPin('');
      setConnectionStatus('');
      localStorage.removeItem('bkk_sync_session');
      const savedLocal = localStorage.getItem('bkk_expenses_2025');
      if (savedLocal) setExpenses(JSON.parse(savedLocal));
      else setExpenses([]);
  };

  const handleAddUser = async () => {
      if (!newUserName.trim()) return;
      const newId = newUserName.trim();
      if (users.find(u => u.id === newId || u.name === newUserName.trim())) {
          alert("使用者已存在");
          return;
      }
      const newUsers = [...users, { id: newId, name: newUserName.trim() }];
      setUsers(newUsers);
      setNewUserName('');

      if (isSyncMode && syncService.isReady()) {
          await syncService.updateUsers(groupId, pin, newUsers);
      }
  };

  const handleRemoveUser = async (id: string) => {
      if (users.length <= 1) {
          alert("至少需要保留一位使用者");
          return;
      }
      // New Validation: Check if involved in ANY expense (Payer OR Split)
      const hasRecords = expenses.some(e => 
          e.paidBy === id || 
          (e.involvedUsers && e.involvedUsers.includes(id))
      );

      if (hasRecords) {
          alert("此使用者仍有帳務紀錄（付款或分帳），無法刪除。請先修改或刪除相關帳務。");
          return;
      }

      const newUsers = users.filter(u => u.id !== id);
      setUsers(newUsers);
      if (payer === id) setPayer(newUsers[0].id);

      if (isSyncMode && syncService.isReady()) {
          await syncService.updateUsers(groupId, pin, newUsers);
      }
  };

  const resetForm = () => {
      setTitle('');
      setAmount('');
      setEditingId(null);
      setIsFormExpanded(false);
      // Keep date and payer as is for convenience
  };

  const handleEdit = (expense: Expense) => {
      setTitle(expense.title);
      setAmount(expense.amount.toString());
      setCategory(expense.category);
      if (expense.date) setSelectedDate(expense.date);
      setPayer(expense.paidBy);
      setSplitType(expense.splitType);
      
      setEditingId(expense.id);
      setIsFormExpanded(true);
  };

  const handleSave = async () => {
    if (!title || !amount || !selectedDate) return;
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    const currentPayerId = payer || users[0].id;
    
    // Determine involved users snapshot
    let involvedUsers: string[] = [];
    if (splitType === 'self') {
        involvedUsers = [currentPayerId];
    } else {
        // For 'split', we snapshot ALL current users as participants
        // This ensures if a new user joins LATER, they are NOT added to this old expense
        involvedUsers = users.map(u => u.id);
    }

    const expensePayload: Expense = {
      id: editingId || Date.now().toString(),
      title,
      amount: val,
      category,
      dayId: getTripDayId(selectedDate),
      date: selectedDate,
      timestamp: editingId ? (expenses.find(e => e.id === editingId)?.timestamp || Date.now()) : Date.now(),
      paidBy: currentPayerId,
      involvedUsers: involvedUsers, // CRITICAL: Save the snapshot
      splitType,
      isSettled: false
    };

    if (isSyncMode && syncService.isReady()) {
        if (editingId) {
             await syncService.updateExpense(groupId, pin, expensePayload);
        } else {
             await syncService.addExpense(groupId, pin, expensePayload);
        }
    } else {
        if (editingId) {
            setExpenses(prev => prev.map(e => e.id === editingId ? expensePayload : e));
        } else {
            setExpenses(prev => [expensePayload, ...prev]);
        }
    }
    
    resetForm();
  };

  const handleCancelEdit = () => {
      resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("確定刪除此筆消費？")) return;
    if (isSyncMode && syncService.isReady()) {
        await syncService.deleteExpense(groupId, pin, id);
    } else {
        setExpenses(prev => prev.filter(e => e.id !== id));
    }
    if (editingId === id) resetForm();
  };

  const handleSettleUp = async () => {
      if (!isSyncMode || !syncService.isReady()) {
          setExpenses(prev => prev.map(e => ({ ...e, isSettled: true })));
          return;
      }
      const unsettledIds = expenses.filter(e => !e.isSettled).map(e => e.id);
      if (unsettledIds.length > 0) {
          await syncService.settleExpenses(groupId, pin, unsettledIds);
      }
  };

  // Calculations
  const stats = useMemo(() => {
      // Map names for quick lookup
      const idToName: Record<string, string> = {};
      users.forEach(u => idToName[u.id] = u.name);

      // We track stats by ID now to be safe
      const userStatsById: Record<string, { name: string, paid: number, share: number }> = {};
      
      // Initialize for current users
      users.forEach(u => {
          userStatsById[u.id] = { name: u.name, paid: 0, share: 0 };
      });

      let total = 0;
      let settled = true;

      expenses.forEach(e => {
          total += e.amount;
          if (!e.isSettled) settled = false;

          const payerId = e.paidBy;
          
          // Safety: If payer deleted (shouldn't happen with new logic), fallback or ignore
          if (!userStatsById[payerId]) {
              // Create temporary entry for ghost user so math balances
              userStatsById[payerId] = { name: idToName[payerId] || payerId, paid: 0, share: 0 };
          }
          userStatsById[payerId].paid += e.amount;

          // Calculate Share
          // Use involvedUsers snapshot if available (new logic), otherwise fallback to all current users (legacy logic)
          const participants = (e.involvedUsers && e.involvedUsers.length > 0) 
              ? e.involvedUsers 
              : users.map(u => u.id);

          if (participants.length > 0) {
             const perUser = e.amount / participants.length;
             participants.forEach(uid => {
                 if (!userStatsById[uid]) {
                     // If a user was in the split but is now deleted (legacy data edge case), add ghost entry
                     userStatsById[uid] = { name: idToName[uid] || uid, paid: 0, share: 0 };
                 }
                 userStatsById[uid].share += perUser;
             });
          }
      });

      // Transform to view model
      const userStats: Record<string, { paid: number, share: number }> = {};
      Object.values(userStatsById).forEach(v => {
          userStats[v.name] = { paid: v.paid, share: v.share };
      });

      // Calculate debts
      const debts = [];
      const statsList = Object.values(userStatsById);
      if (statsList.length > 1) {
          for (const s of statsList) {
              const diff = s.paid - s.share;
              if (Math.abs(diff) > 1) {
                  debts.push({ name: s.name, amount: diff });
              }
          }
      }

      return { total, userStats, debts, settled };
  }, [expenses, users]);

  // Filter Logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
        if (filterDate !== 'all') {
            const eDate = e.date || new Date(e.timestamp).toISOString().split('T')[0];
            if (eDate !== filterDate) return false;
        }
        if (filterPayer !== 'all' && e.paidBy !== filterPayer) return false;
        return true;
    });
  }, [expenses, filterDate, filterPayer]);

  return (
    <>
      <button
        onClick={onRequestOpen}
        className={`fixed bottom-8 right-6 z-50 bg-stone-800 text-white p-4 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:bg-stone-700 active:scale-95 transition-all duration-300 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        aria-label="Open Expense Tracker"
      >
        <Wallet size={24} />
      </button>

      <div 
        className={`fixed inset-y-0 right-0 w-full sm:w-[450px] bg-[#F9F9F7] shadow-2xl z-50 transform transition-transform duration-300 flex flex-col border-l border-stone-200 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header Summary */}
        <div className={`px-6 pt-6 pb-6 text-white shadow-md transition-colors duration-500 relative flex-shrink-0 ${isSyncMode ? 'bg-emerald-900' : 'bg-stone-900'}`}>
          <div className="flex justify-between items-start relative z-10 mb-4">
              <div>
                  <div className="flex items-center gap-2 mb-1">
                      <p className="text-[10px] text-white/60 uppercase tracking-widest font-medium">Total Cost</p>
                      {isSyncMode && (
                          <div className="flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                              <Cloud size={10} className="text-emerald-300" />
                              <span className="text-[9px] font-bold text-emerald-300">{groupId}</span>
                          </div>
                      )}
                  </div>
                  <div className="flex items-baseline gap-1">
                      <span className="text-lg font-light opacity-60">฿</span>
                      <h2 className="text-4xl font-bold tracking-tight">{stats.total.toLocaleString()}</h2>
                  </div>
              </div>
              
              <div className="flex gap-2">
                  <button onClick={() => setShowUserManage(!showUserManage)} className={`p-2 rounded-full transition-colors ${showUserManage ? 'bg-white text-stone-900' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                     <Users size={20} />
                  </button>
                  {isSyncMode ? (
                      <button onClick={handleLogout} className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-200 hover:text-white transition-colors">
                          <LogOut size={20} />
                      </button>
                  ) : (
                      <button onClick={() => setShowAuth(true)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                          <CloudOff size={20} />
                      </button>
                  )}
                  <button onClick={onRequestClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors text-white">
                      <X size={20} />
                  </button>
              </div>
          </div>

          {/* User Management Panel */}
          {showUserManage && (
              <div className="mb-4 bg-black/20 rounded-xl p-3 animate-fade-in backdrop-blur-sm">
                  <h4 className="text-xs font-bold text-white/70 mb-2 uppercase tracking-wider flex items-center gap-2">
                      管理使用者 ({users.length})
                  </h4>
                  <div className="space-y-2">
                      {users.map(u => (
                          <div key={u.id} className="flex items-center justify-between bg-white/10 px-3 py-2 rounded-lg">
                              <span className="text-sm font-bold">{u.name}</span>
                              <div className="flex items-center gap-3">
                                  <div className="text-xs text-white/50">
                                      {stats.userStats[u.name] ? `付 ฿${stats.userStats[u.name].paid.toLocaleString()}` : '฿0'}
                                  </div>
                                  <button onClick={() => handleRemoveUser(u.id)} className="text-white/40 hover:text-red-300">
                                      <MinusCircle size={16} />
                                  </button>
                              </div>
                          </div>
                      ))}
                      <div className="flex gap-2 mt-2">
                          <input 
                            type="text" 
                            value={newUserName} 
                            onChange={e => setNewUserName(e.target.value)}
                            placeholder="新成員名字..." 
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:bg-white/20"
                          />
                          <button onClick={handleAddUser} className="bg-white/20 hover:bg-white/30 px-3 rounded-lg text-white">
                              <Plus size={16} />
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {/* Stats Summary */}
          {users.length === 1 ? (
             <div className="bg-white/5 p-2.5 rounded-lg border border-white/5">
                <div className="flex items-center gap-1.5 mb-1 opacity-70">
                    <User size={12} />
                    <span className="text-[10px] uppercase tracking-wider">個人總花費</span>
                </div>
                <span className="text-lg font-bold block">฿{stats.total.toLocaleString()}</span>
             </div>
          ) : (
             <div className="grid gap-2">
                 {stats.debts.length > 0 ? (
                     <div className="bg-white text-stone-900 rounded-xl p-3 shadow-lg">
                         <div className="flex items-center gap-2 mb-2 pb-2 border-b border-stone-100">
                             <ArrowRightLeft size={14} className="text-stone-400" />
                             <span className="text-xs font-bold uppercase text-stone-500">分帳概況</span>
                         </div>
                         <div className="space-y-1.5">
                             {stats.debts.map(d => (
                                 <div key={d.name} className="flex justify-between items-center text-xs">
                                     <span className="font-bold text-stone-700">{d.name}</span>
                                     <span className={d.amount > 0 ? "text-emerald-600 font-bold" : "text-red-500 font-bold"}>
                                         {d.amount > 0 ? `應收 ฿${Math.floor(d.amount).toLocaleString()}` : `應付 ฿${Math.floor(Math.abs(d.amount)).toLocaleString()}`}
                                     </span>
                                 </div>
                             ))}
                         </div>
                         {!stats.settled && (
                            <button 
                                onClick={handleSettleUp}
                                className="w-full mt-3 bg-stone-900 text-white py-1.5 rounded-md text-xs font-bold hover:bg-stone-700 active:scale-95 transition-all"
                            >
                                全部結清 (Settle All)
                            </button>
                         )}
                     </div>
                 ) : (
                     <div className="bg-white/10 rounded-xl p-3 flex items-center justify-center gap-2 text-white/80 text-xs border border-white/10">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span className="font-medium">目前沒有欠款 (All Settled)</span>
                     </div>
                 )}
             </div>
          )}
        </div>

        {/* Auth Panel */}
        {showAuth && (
            <div className="p-4 bg-stone-100 border-b border-stone-200 animate-fade-in flex-shrink-0">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-stone-700 text-sm flex items-center gap-2">
                            <Cloud size={16} className="text-emerald-600" />
                            雲端同步
                        </h3>
                        <button onClick={() => setShowAuth(false)} className="text-stone-400 hover:text-stone-600"><X size={16} /></button>
                    </div>
                    {firebaseError && (
                         <div className="mb-3 p-2 bg-red-50 text-red-600 text-xs rounded border border-red-100">
                            Firebase 設定未完成。
                         </div>
                    )}
                    <div className="space-y-3">
                        <input type="text" value={tempGroupId} onChange={e => setTempGroupId(e.target.value)} placeholder="Trip ID (e.g. BKK123)" className="w-full bg-stone-50 border border-stone-200 rounded px-2 py-2 text-sm" />
                        <input type="password" value={tempPin} onChange={e => setTempPin(e.target.value)} placeholder="PIN Password" className="w-full bg-stone-50 border border-stone-200 rounded px-2 py-2 text-sm" />
                        <button onClick={handleLogin} disabled={firebaseError} className="w-full bg-stone-800 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-stone-700 flex justify-center items-center gap-2 shadow-sm">
                            <LogIn size={14} /> 開始同步
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Form Toggle */}
        <button 
            onClick={() => {
                if (isFormExpanded && editingId) {
                    resetForm();
                } else {
                    setIsFormExpanded(!isFormExpanded);
                }
            }}
            className="w-full bg-white border-b border-stone-100 p-3 flex items-center justify-between hover:bg-stone-50 transition-colors flex-shrink-0 z-20 relative"
        >
            <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-full transition-colors ${isFormExpanded ? (editingId ? 'bg-orange-500 text-white' : 'bg-stone-800 text-white') : 'bg-stone-100 text-stone-400'}`}>
                    {editingId ? <Pencil size={14} /> : <Plus size={14} />}
                </div>
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    {editingId ? '編輯消費 (Edit)' : (isFormExpanded ? '取消新增' : '記一筆 (Add)')}
                </span>
            </div>
            {isFormExpanded ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
        </button>

        {/* Input Form */}
        <div className={`bg-white border-b border-stone-100 overflow-hidden transition-all duration-300 ease-in-out flex-shrink-0 shadow-sm relative z-10 ${isFormExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-4 space-y-3">
            <div className="flex gap-3">
                <div className="flex-1">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">項目</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="早餐、計程車..." className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:bg-white transition-all" />
                </div>
                <div className="w-24">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">金額</label>
                    <input type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:bg-white transition-all font-mono" />
                </div>
            </div>

            {/* Payer & Date Selection */}
            <div className="flex items-center gap-2">
                <div className="flex-1 overflow-x-auto no-scrollbar">
                    <div className="flex bg-stone-100 p-1 rounded-lg gap-1 min-w-max">
                        {users.map(u => (
                            <button 
                                key={u.id} 
                                onClick={() => setPayer(u.id)} 
                                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all whitespace-nowrap ${payer === u.id ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                            >
                                {u.name}付
                            </button>
                        ))}
                    </div>
                </div>
                <div className="w-32 flex-shrink-0">
                    <div className="relative">
                        <input 
                            type="date" 
                            value={selectedDate} 
                            onChange={e => setSelectedDate(e.target.value)} 
                            onClick={(e) => {
                                try {
                                    // @ts-ignore
                                    e.currentTarget.showPicker?.();
                                } catch (error) {}
                            }}
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-8 pr-2 py-1.5 text-xs font-bold text-stone-700 focus:outline-none focus:bg-white transition-all"
                        />
                        <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Split Type (Only show if > 1 user) */}
            {users.length > 1 && (
                <div className="flex bg-stone-100 p-1 rounded-lg gap-1">
                    <button onClick={() => setSplitType('split')} className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${splitType === 'split' ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-400'}`}>均分 (Split)</button>
                    <button onClick={() => setSplitType('self')} className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${splitType === 'self' ? 'bg-white text-stone-700 shadow-sm' : 'text-stone-400'}`}>自費 (Personal)</button>
                </div>
            )}
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setCategory(cat.id as any)} className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap ${category === cat.id ? `${cat.bg} ${cat.color} border-${cat.color.split('-')[1]}-200` : 'bg-white border-stone-200 text-stone-400'}`}>{cat.label}</button>
                ))}
            </div>

            <div className="flex gap-2">
                {editingId && (
                     <button onClick={handleCancelEdit} className="w-1/3 bg-stone-200 text-stone-600 px-4 py-2.5 rounded-lg text-sm font-bold active:scale-95">
                        取消
                     </button>
                )}
                <button onClick={handleSave} disabled={!title || !amount || !selectedDate} className={`flex-1 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-md active:scale-95 flex items-center justify-center gap-2 ${editingId ? 'bg-orange-600 hover:bg-orange-700' : (isSyncMode ? 'bg-emerald-600' : 'bg-stone-800')}`}>
                    {editingId ? <Pencil size={16} /> : <Plus size={16} />} 
                    {editingId ? '更新紀錄' : '確認新增'}
                </button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-4 py-2 bg-stone-50 border-b border-stone-200 flex items-center justify-between sticky top-0 z-10 overflow-x-auto no-scrollbar gap-2">
            <div className="flex items-center gap-2 flex-shrink-0">
                <ListFilter size={14} className="text-stone-400" />
                <span className="text-[10px] font-bold text-stone-400 uppercase hidden sm:inline">記錄列表</span>
            </div>
            
            <div className="flex gap-2 flex-1 justify-end min-w-0">
                {/* Date Filters */}
                <div className="flex bg-white rounded border border-stone-200 p-0.5">
                    <button 
                        onClick={() => setFilterDate('all')}
                        className={`px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 transition-all ${filterDate === 'all' ? 'bg-stone-800 text-white shadow-sm' : 'text-stone-500 hover:bg-stone-100'}`}
                    >
                        <CalendarDays size={10} />
                        所有日期
                    </button>
                    <div className="w-px bg-stone-100 mx-0.5 my-1"></div>
                    <div className="relative flex items-center pr-1">
                        <input 
                            type="date"
                            value={filterDate === 'all' ? '' : filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            onClick={(e) => {
                                try {
                                    // @ts-ignore
                                    e.currentTarget.showPicker?.();
                                } catch (error) {}
                            }}
                            className={`text-[10px] font-bold bg-transparent focus:outline-none w-[88px] ${filterDate !== 'all' ? 'text-stone-800' : 'text-stone-400'}`}
                        />
                        <Calendar size={10} className="text-stone-400 absolute right-0 pointer-events-none" />
                    </div>
                </div>

                {/* Payer Filter */}
                <select 
                    value={filterPayer} 
                    onChange={(e) => setFilterPayer(e.target.value as any)} 
                    className="bg-white border border-stone-200 text-[10px] font-bold rounded px-2 py-1 text-stone-600 focus:outline-none max-w-[100px]"
                >
                    <option value="all">所有付款人</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
            </div>
        </div>
        
        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#F9F9F7] pb-24 relative">
            {connectionStatus && isSyncMode ? (
                <div className="absolute inset-0 bg-[#F9F9F7]/90 z-20 flex flex-col items-center justify-center text-stone-500 gap-3">
                    {connectionStatus.includes('❌') ? (
                        <div className="text-red-500 flex flex-col items-center">
                            <CloudOff size={32} className="mb-2 opacity-80" />
                            <span className="text-sm font-bold">{connectionStatus}</span>
                        </div>
                    ) : (
                        <>
                            <Loader2 size={24} className="animate-spin text-emerald-600" />
                            <span className="text-xs font-bold tracking-wider animate-pulse">{connectionStatus}</span>
                        </>
                    )}
                </div>
            ) : null}

            {filteredExpenses.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-stone-300">
                    <ListFilter size={32} strokeWidth={1} className="mb-2 opacity-30" />
                    <p className="text-xs font-medium opacity-50">沒有符合的紀錄</p>
                </div>
            ) : (
                filteredExpenses.map(expense => {
                    const CatConfig = CATEGORIES.find(c => c.id === expense.category) || CATEGORIES[3];
                    const isSelf = expense.splitType === 'self';
                    const payerName = users.find(u => u.id === expense.paidBy)?.name || expense.paidBy;
                    
                    // Format date display
                    let displayDate = '';
                    if (expense.date) {
                        const [y, m, d] = expense.date.split('-');
                        displayDate = `${parseInt(m)}/${parseInt(d)}`;
                    } else {
                        const d = new Date(expense.timestamp);
                        displayDate = `${d.getMonth() + 1}/${d.getDate()}`;
                    }
                    
                    const dayLabel = expense.dayId > 0 ? `Day ${expense.dayId}` : '';

                    return (
                        <div key={expense.id} className={`group bg-white p-3 rounded-lg border shadow-sm flex items-center justify-between hover:shadow-md transition-all ${expense.isSettled ? 'opacity-50 border-stone-100 grayscale' : 'border-stone-100'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center relative shadow-sm flex-shrink-0 ${expense.isSettled ? 'bg-stone-100 text-stone-400' : `${CatConfig.bg} ${CatConfig.color}`}`}>
                                    {expense.isSettled && <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-full"><CheckCircle2 size={12} className="text-stone-500"/></div>}
                                    <CatConfig.icon size={14} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className={`text-sm font-bold mb-0.5 truncate max-w-[120px] sm:max-w-[160px] ${expense.isSettled ? 'text-stone-400 line-through' : 'text-stone-800'}`}>{expense.title}</h4>
                                    <div className="flex items-center gap-1.5 text-[10px] text-stone-400">
                                        <span className={`px-1 py-0.5 rounded font-bold tracking-wide bg-stone-100 text-stone-500`}>
                                            {displayDate}
                                            {dayLabel && <span className="font-normal opacity-60 ml-1">({dayLabel})</span>}
                                        </span>
                                        <span className="font-bold flex items-center gap-0.5 text-stone-600">
                                            <User size={8} />
                                            {payerName}
                                        </span>
                                        {isSelf && <span className="bg-stone-50 px-1 py-0.5 rounded text-stone-500 border border-stone-200">自費</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end pl-2">
                                <span className={`text-sm font-bold font-mono tracking-tight ${expense.isSettled ? 'text-stone-400' : 'text-stone-800'}`}>฿{expense.amount.toLocaleString()}</span>
                                {!expense.isSettled && (
                                    <div className="flex items-center gap-1 mt-1">
                                         <button onClick={() => handleEdit(expense)} className="text-stone-300 hover:text-orange-500 transition-colors p-1.5 active:scale-90">
                                            <Pencil size={12} />
                                        </button>
                                        <button onClick={() => handleDelete(expense.id)} className="text-stone-300 hover:text-red-500 transition-colors p-1.5 -mr-1.5 active:scale-90">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>
      
      {isOpen && <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-[2px] z-40" onClick={onRequestClose} />}
    </>
  );
};

export default ExpenseTracker;