import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, Plus, X, Trash2, ShoppingBag, Utensils, Bus, MoreHorizontal, Cloud, CloudOff, LogOut, LogIn, User, CheckCircle2, ArrowRightLeft, Users, Gift, UserCircle, Calculator, Filter, ListFilter, ChevronDown, ChevronUp } from 'lucide-react';
import { Expense } from '../types';
import { syncService } from '../services/firebase';

const CATEGORIES = [
  { id: 'food', label: '餐飲', icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'shopping', label: '購物', icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'transport', label: '交通', icon: Bus, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'other', label: '其他', icon: MoreHorizontal, color: 'text-gray-600', bg: 'bg-gray-50' },
] as const;

// 使用者名稱設定
const USER_NAMES = {
  A: 'Jimin',
  B: 'Simon'
};

const ExpenseTracker: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // Sync State
  const [isSyncMode, setIsSyncMode] = useState(false);
  const [groupId, setGroupId] = useState('');
  const [pin, setPin] = useState('');
  const [tempGroupId, setTempGroupId] = useState('');
  const [tempPin, setTempPin] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [firebaseError, setFirebaseError] = useState(false);

  // Form State
  const [isFormExpanded, setIsFormExpanded] = useState(false); // Collapsible State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('food');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [payer, setPayer] = useState<'A' | 'B'>('A');
  const [splitType, setSplitType] = useState<'split' | 'self' | 'other'>('split');

  // Filter State
  const [filterDay, setFilterDay] = useState<number | 'all'>('all');
  const [filterPayer, setFilterPayer] = useState<'A' | 'B' | 'all'>('all');

  // Initialize
  useEffect(() => {
    // Check if configured
    if (!syncService.isReady()) {
        setFirebaseError(true);
    }
    
    // Load local storage first
    const savedLocal = localStorage.getItem('bkk_expenses_2025');
    if (savedLocal) {
        try {
            setExpenses(JSON.parse(savedLocal));
        } catch (e) { console.error(e); }
    }

    // Restore session
    const savedSession = localStorage.getItem('bkk_sync_session');
    if (savedSession) {
        try {
            const { g, p } = JSON.parse(savedSession);
            if (g && p) {
                setGroupId(g);
                setPin(p);
                // Also pre-fill the form inputs so they are ready if user logs out
                setTempGroupId(g);
                setTempPin(p);
                setIsSyncMode(true);
            }
        } catch (e) {}
    }
  }, []);

  // Sync Subscription
  useEffect(() => {
    if (isSyncMode && groupId && pin && syncService.isReady()) {
        const unsubscribe = syncService.subscribe(groupId, pin, (data) => {
            setExpenses(data);
        });
        return () => unsubscribe();
    }
  }, [isSyncMode, groupId, pin]);

  // Local Storage Saver (Only runs when NOT in sync mode)
  useEffect(() => {
    if (!isSyncMode) {
        localStorage.setItem('bkk_expenses_2025', JSON.stringify(expenses));
    }
  }, [expenses, isSyncMode]);

  const handleLogin = () => {
      if (!tempGroupId || !tempPin) return;
      setGroupId(tempGroupId);
      setPin(tempPin);
      setIsSyncMode(true);
      setShowAuth(false);
      localStorage.setItem('bkk_sync_session', JSON.stringify({ g: tempGroupId, p: tempPin }));
  };

  const handleLogout = () => {
      const confirmLogout = window.confirm("確定要登出同步模式嗎？");
      if (!confirmLogout) return;

      setIsSyncMode(false);
      setGroupId('');
      setPin('');
      localStorage.removeItem('bkk_sync_session');
      // Note: We do NOT clear tempGroupId/tempPin here, so user can easily log back in if needed.
      const savedLocal = localStorage.getItem('bkk_expenses_2025');
      if (savedLocal) setExpenses(JSON.parse(savedLocal));
      else setExpenses([]);
  };

  const handleAdd = () => {
    if (!title || !amount) return;
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    const newExpense: Expense = {
      id: Date.now().toString(),
      title,
      amount: val,
      category,
      dayId: selectedDay,
      timestamp: Date.now(),
      paidBy: payer,
      splitType,
      isSettled: false
    };

    if (isSyncMode && syncService.isReady()) {
        syncService.addExpense(groupId, pin, newExpense);
    } else {
        setExpenses(prev => [newExpense, ...prev]);
    }

    setTitle('');
    setAmount('');
    // Reset to default
    setSplitType('split');
  };

  const handleDelete = (id: string) => {
    if (isSyncMode && syncService.isReady()) {
        syncService.deleteExpense(groupId, pin, id);
    } else {
        setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleSettleUp = () => {
      if (!isSyncMode || !syncService.isReady()) {
          setExpenses(prev => prev.map(e => ({ ...e, isSettled: true })));
          return;
      }

      const unsettledIds = expenses.filter(e => !e.isSettled).map(e => e.id);
      if (unsettledIds.length > 0) {
          syncService.settleExpenses(groupId, pin, unsettledIds);
      }
  };

  // Calculations
  const stats = useMemo(() => {
      let total = 0;
      let costA = 0; // Jimin's true cost
      let costB = 0; // Simon's true cost
      
      // Net Balance Calculation
      let netBalance = 0;
      let hasUnsettled = false;

      expenses.forEach(e => {
          total += e.amount;
          const mode = e.splitType || 'split';

          if (mode === 'split') {
              costA += e.amount / 2;
              costB += e.amount / 2;
          } else if (mode === 'self') {
              if (e.paidBy === 'A') costA += e.amount;
              else costB += e.amount;
          } else if (mode === 'other') {
              if (e.paidBy === 'A') costB += e.amount;
              else costA += e.amount;
          }

          if (!e.isSettled) {
              hasUnsettled = true;
              const amt = e.amount;
              
              if (e.paidBy === 'A') {
                  if (mode === 'split') netBalance += amt / 2;
                  if (mode === 'other') netBalance += amt;
              } else { // Paid by B
                  if (mode === 'split') netBalance -= amt / 2;
                  if (mode === 'other') netBalance -= amt;
              }
          }
      });
      
      return { total, costA, costB, netBalance, hasUnsettled };
  }, [expenses]);

  // Filter Logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
        if (filterDay !== 'all' && e.dayId !== filterDay) return false;
        if (filterPayer !== 'all' && e.paidBy !== filterPayer) return false;
        return true;
    });
  }, [expenses, filterDay, filterPayer]);

  const filteredTotal = useMemo(() => {
      return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  return (
    <>
      {/* Floating Action Button - Moved back to RIGHT bottom */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-6 z-50 bg-stone-800 text-white p-4 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:bg-stone-700 active:scale-95 transition-all duration-300 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        aria-label="Open Expense Tracker"
      >
        <Wallet size={24} />
      </button>

      {/* Drawer - Slides from RIGHT */}
      <div 
        className={`fixed inset-y-0 right-0 w-full sm:w-[450px] bg-[#F9F9F7] shadow-2xl z-50 transform transition-transform duration-300 flex flex-col border-l border-stone-200 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header Summary - Removed overflow-hidden to fix clipping */}
        <div className={`px-6 pt-6 pb-6 text-white shadow-md transition-colors duration-500 relative flex-shrink-0 ${isSyncMode ? 'bg-emerald-900' : 'bg-stone-900'}`}>
          <div className="flex justify-between items-start relative z-10 mb-4">
              <div>
                  <div className="flex items-center gap-2 mb-1">
                      <p className="text-[10px] text-white/60 uppercase tracking-widest font-medium">Total Trip Cost</p>
                      {isSyncMode ? (
                          <div className="flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                              <Cloud size={10} className="text-emerald-300" />
                              <span className="text-[9px] font-bold text-emerald-300">SYNC: {groupId}</span>
                          </div>
                      ) : (
                          <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full">
                              <CloudOff size={10} className="text-white/40" />
                              <span className="text-[9px] font-bold text-white/40">LOCAL</span>
                          </div>
                      )}
                  </div>
                  <div className="flex items-baseline gap-1">
                      <span className="text-lg font-light opacity-60">฿</span>
                      <h2 className="text-4xl font-bold tracking-tight">{stats.total.toLocaleString()}</h2>
                  </div>
              </div>
              
              <div className="flex gap-2">
                  {!isSyncMode ? (
                      <button onClick={() => setShowAuth(true)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                          <CloudOff size={20} />
                      </button>
                  ) : (
                      <button onClick={handleLogout} className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-200 hover:text-white transition-colors border border-red-500/20" title="登出 (Logout)">
                          <LogOut size={20} />
                      </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors text-white">
                      <X size={20} />
                  </button>
              </div>
          </div>

          {/* Individual Costs Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/5 p-2.5 rounded-lg border border-white/5">
                 <div className="flex items-center gap-1.5 mb-1 opacity-70">
                    <UserCircle size={12} />
                    <span className="text-[10px] uppercase tracking-wider">{USER_NAMES.A} 總花費</span>
                 </div>
                 <span className="text-lg font-bold block">฿{stats.costA.toLocaleString()}</span>
              </div>
              <div className="bg-white/5 p-2.5 rounded-lg border border-white/5">
                 <div className="flex items-center gap-1.5 mb-1 opacity-70">
                    <UserCircle size={12} />
                    <span className="text-[10px] uppercase tracking-wider">{USER_NAMES.B} 總花費</span>
                 </div>
                 <span className="text-lg font-bold block">฿{stats.costB.toLocaleString()}</span>
              </div>
          </div>

          {/* Debt Summary Bar */}
          {stats.hasUnsettled ? (
             <div className="bg-white text-stone-900 rounded-xl p-3 shadow-lg transform transition-all border border-stone-200">
                 <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 text-sm">
                        <ArrowRightLeft size={16} className="text-stone-400" />
                        <span className="font-bold text-stone-700">
                            {Math.abs(stats.netBalance) < 1 ? "目前結清" : 
                             stats.netBalance > 0 ? `${USER_NAMES.B} 欠 ${USER_NAMES.A}` : `${USER_NAMES.A} 欠 ${USER_NAMES.B}`}
                        </span>
                    </div>
                    <span className="text-xl font-black tracking-tight">฿{Math.floor(Math.abs(stats.netBalance)).toLocaleString()}</span>
                 </div>
                 <button 
                    onClick={handleSettleUp}
                    className="w-full bg-stone-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-stone-700 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                 >
                    <CheckCircle2 size={12} />
                    一鍵結清 (Mark as Paid)
                 </button>
             </div>
          ) : (
             <div className="bg-white/10 rounded-xl p-3 flex items-center justify-center gap-2 text-white/80 text-xs border border-white/10">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="font-medium">目前沒有欠款 (All Settled)</span>
             </div>
          )}
        </div>

        {/* Auth Panel (Sync) */}
        {showAuth && (
            <div className="p-4 bg-stone-100 border-b border-stone-200 animate-fade-in flex-shrink-0">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-stone-700 text-sm flex items-center gap-2">
                            <Cloud size={16} className="text-emerald-600" />
                            雲端同步設定
                        </h3>
                        <button onClick={() => setShowAuth(false)} className="text-stone-400 hover:text-stone-600"><X size={16} /></button>
                    </div>
                    {firebaseError && (
                         <div className="mb-3 p-2 bg-red-50 text-red-600 text-xs rounded border border-red-100">
                            Firebase 設定未完成。請檢查環境變數 (FIREBASE_CONFIG) 或瀏覽器 Console。
                         </div>
                    )}
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] text-stone-400 font-bold uppercase mb-1 block">Trip ID (房間號)</label>
                            <input type="text" value={tempGroupId} onChange={e => setTempGroupId(e.target.value)} placeholder="例如: BKK2025" className="w-full bg-stone-50 border border-stone-200 rounded px-2 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-[10px] text-stone-400 font-bold uppercase mb-1 block">PIN (密碼)</label>
                            <input type="password" value={tempPin} onChange={e => setTempPin(e.target.value)} placeholder="自訂數字密碼" className="w-full bg-stone-50 border border-stone-200 rounded px-2 py-2 text-sm" />
                        </div>
                        <button onClick={handleLogin} disabled={firebaseError} className="w-full bg-stone-800 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-stone-700 flex justify-center items-center gap-2 shadow-sm">
                            <LogIn size={14} /> 開始同步
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Toggle Bar for Input Form */}
        <button 
            onClick={() => setIsFormExpanded(!isFormExpanded)}
            className="w-full bg-white border-b border-stone-100 p-3 flex items-center justify-between hover:bg-stone-50 transition-colors flex-shrink-0 z-20 relative"
        >
            <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-full transition-colors ${isFormExpanded ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-400'}`}>
                    <Plus size={14} />
                </div>
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    {isFormExpanded ? '新增消費 (New Expense)' : '點擊新增消費 (Add Expense)'}
                </span>
            </div>
            {isFormExpanded ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
        </button>

        {/* Input Form Area - Collapsible */}
        <div className={`bg-white border-b border-stone-100 overflow-hidden transition-all duration-300 ease-in-out flex-shrink-0 shadow-sm relative z-10 ${isFormExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-4 space-y-3">
            <div className="flex gap-3">
                <div className="flex-1">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">項目</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="消費項目..." className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:bg-white transition-all" />
                </div>
                <div className="w-24">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">金額</label>
                    <input type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:bg-white transition-all font-mono" />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <div className="flex bg-stone-100 p-1 rounded-lg">
                        <button onClick={() => setPayer('A')} className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all ${payer === 'A' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400'}`}>{USER_NAMES.A}付</button>
                        <button onClick={() => setPayer('B')} className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all ${payer === 'B' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400'}`}>{USER_NAMES.B}付</button>
                    </div>
                </div>
                <div className="w-20">
                    <select value={selectedDay} onChange={e => setSelectedDay(Number(e.target.value))} className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1.5 text-xs font-bold text-stone-700">
                        {[1, 2, 3, 4, 5, 6].map(d => <option key={d} value={d}>D{d}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex bg-stone-100 p-1 rounded-lg gap-1">
                <button onClick={() => setSplitType('split')} className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${splitType === 'split' ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-400'}`}>平分</button>
                <button onClick={() => setSplitType('self')} className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${splitType === 'self' ? 'bg-white text-stone-700 shadow-sm' : 'text-stone-400'}`}>自費</button>
                <button onClick={() => setSplitType('other')} className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${splitType === 'other' ? 'bg-white text-orange-700 shadow-sm' : 'text-stone-400'}`}>幫付</button>
            </div>
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setCategory(cat.id as any)} className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap ${category === cat.id ? `${cat.bg} ${cat.color} border-${cat.color.split('-')[1]}-200` : 'bg-white border-stone-200 text-stone-400'}`}>{cat.label}</button>
                ))}
            </div>

            <button onClick={handleAdd} disabled={!title || !amount} className={`w-full text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-md active:scale-95 flex items-center justify-center gap-2 ${isSyncMode ? 'bg-emerald-600' : 'bg-stone-800'}`}>
                <Plus size={16} /> 確認新增 (Confirm)
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-4 py-2 bg-stone-50 border-b border-stone-200 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-2">
                <ListFilter size={14} className="text-stone-400" />
                <span className="text-[10px] font-bold text-stone-400 uppercase">Filters</span>
            </div>
            <div className="flex gap-2">
                <select 
                    value={filterDay} 
                    onChange={(e) => setFilterDay(e.target.value === 'all' ? 'all' : Number(e.target.value))} 
                    className="bg-white border border-stone-200 text-[10px] font-bold rounded px-2 py-1 text-stone-600 focus:outline-none"
                >
                    <option value="all">所有日期</option>
                    {[1, 2, 3, 4, 5, 6].map(d => <option key={d} value={d}>Day {d}</option>)}
                </select>
                <select 
                    value={filterPayer} 
                    onChange={(e) => setFilterPayer(e.target.value as any)} 
                    className="bg-white border border-stone-200 text-[10px] font-bold rounded px-2 py-1 text-stone-600 focus:outline-none"
                >
                    <option value="all">所有付款人</option>
                    <option value="A">{USER_NAMES.A}</option>
                    <option value="B">{USER_NAMES.B}</option>
                </select>
            </div>
        </div>
        
        {/* Filtered Total (Only shows if filtered) */}
        {(filterDay !== 'all' || filterPayer !== 'all') && (
            <div className="px-4 py-1.5 bg-yellow-50 border-b border-yellow-100 flex justify-between items-center text-xs text-yellow-800">
                <span className="font-medium">篩選小計 (Filtered Total):</span>
                <span className="font-bold font-mono">฿{filteredTotal.toLocaleString()}</span>
            </div>
        )}

        {/* Expense List - Grows to fill space */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#F9F9F7] pb-24">
            {filteredExpenses.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-stone-300">
                    <ListFilter size={32} strokeWidth={1} className="mb-2 opacity-30" />
                    <p className="text-xs font-medium opacity-50">沒有符合條件的消費紀錄</p>
                </div>
            ) : (
                filteredExpenses.map(expense => {
                    const CatConfig = CATEGORIES.find(c => c.id === expense.category) || CATEGORIES[3];
                    const mode = expense.splitType || 'split';
                    
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
                                        <span className="bg-stone-100 px-1 py-0.5 rounded font-bold tracking-wide">D{expense.dayId}</span>
                                        <span className={`font-bold flex items-center gap-0.5 ${expense.paidBy === 'A' ? 'text-blue-600' : 'text-pink-600'}`}>
                                            <User size={8} />
                                            {USER_NAMES[expense.paidBy]}
                                        </span>
                                        {mode === 'self' && <span className="bg-stone-50 px-1 py-0.5 rounded text-stone-500 border border-stone-200">自費</span>}
                                        {mode === 'other' && <span className="bg-orange-50 px-1 py-0.5 rounded text-orange-600 border border-orange-100">幫付</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end pl-2">
                                <span className={`text-sm font-bold font-mono tracking-tight ${expense.isSettled ? 'text-stone-400' : 'text-stone-800'}`}>฿{expense.amount.toLocaleString()}</span>
                                {!expense.isSettled && (
                                    <button onClick={() => handleDelete(expense.id)} className="text-stone-300 hover:text-red-500 transition-colors p-1.5 -mr-1.5 active:scale-90">
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>
      
      {isOpen && <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-[2px] z-40" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default ExpenseTracker;