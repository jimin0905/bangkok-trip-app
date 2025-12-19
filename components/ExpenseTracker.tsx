
import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Wallet, Plus, X, Trash2, ShoppingBag, Utensils, Bus, MoreHorizontal, Cloud, CloudOff, LogOut, LogIn, User, CheckCircle2, ArrowRightLeft, Users, MinusCircle, Loader2, ListFilter, ChevronUp, ChevronDown, Calendar, CalendarDays, Pencil, ArrowDownLeft, Check, AlertCircle, Receipt, CreditCard, Banknote, Settings, Calculator, RefreshCw, Delete, ArrowRight, Info } from 'lucide-react';
import { Expense, UserProfile, TripSettings } from '../types';
import { syncService } from '../services/firebase';

const CATEGORIES = [
  { id: 'food', label: '餐飲', icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'shopping', label: '購物', icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'transport', label: '交通', icon: Bus, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'other', label: '其他', icon: MoreHorizontal, color: 'text-gray-600', bg: 'bg-gray-50' },
] as const;

const DEFAULT_RATES = {
    THB: 0.94,
    MYR: 7.35
};

interface Props {
    isOpen: boolean;
    onRequestOpen: () => void;
    onRequestClose: () => void;
    tripSettings: TripSettings;
    onSettingsSync: (settings: TripSettings) => void;
}

const ExpenseTracker = forwardRef<{ pushSettings: (settings: TripSettings) => Promise<void> }, Props>(({ isOpen, onRequestOpen, onRequestClose, tripSettings, onSettingsSync }, ref) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([{ id: 'u1', name: '我' }]);
  const [showUserManage, setShowUserManage] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [showDebtDetails, setShowDebtDetails] = useState(false);

  const [isSyncMode, setIsSyncMode] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [groupId, setGroupId] = useState('');
  const [pin, setPin] = useState('');
  const [tempGroupId, setTempGroupId] = useState('');
  const [tempPin, setTempPin] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [firebaseError, setFirebaseError] = useState(false);

  const [showExchange, setShowExchange] = useState(false);
  const [calcCurrency, setCalcCurrency] = useState<'THB' | 'MYR'>('THB');
  const [calcAmount, setCalcAmount] = useState('');
  const [showSimpleCalc, setShowSimpleCalc] = useState(false);
  const [simpleCalcDisplay, setSimpleCalcDisplay] = useState('');
  
  const [exchangeRates, setExchangeRates] = useState<{THB: number, MYR: number}>(() => {
      const saved = localStorage.getItem('bkk_exchange_rates');
      return saved ? JSON.parse(saved) : DEFAULT_RATES;
  });

  useEffect(() => {
      localStorage.setItem('bkk_exchange_rates', JSON.stringify(exchangeRates));
  }, [exchangeRates]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const currentRate = exchangeRates[calcCurrency];

  const handleRateChange = (val: string) => {
      const num = parseFloat(val);
      setExchangeRates(prev => ({ ...prev, [calcCurrency]: isNaN(num) ? 0 : num }));
  };

  const calculatedTWD = useMemo(() => {
      const val = parseFloat(calcAmount);
      if (isNaN(val)) return 0;
      return Math.round(val * currentRate);
  }, [calcAmount, currentRate]);

  useImperativeHandle(ref, () => ({
    pushSettings: async (newSettings: TripSettings) => {
      if (isSyncMode && syncService.isReady() && groupId && pin) {
        await syncService.updateSettings(groupId, pin, newSettings);
      }
    }
  }));

  const TRIP_DATES = useMemo(() => {
    const dates = [];
    const start = new Date(tripSettings.startDate);
    const end = new Date(tripSettings.endDate);
    const temp = new Date(start);
    let limit = 0;
    while (temp <= end && limit < 31) {
      const m = String(temp.getMonth() + 1).padStart(2, '0');
      const d = String(temp.getDate()).padStart(2, '0');
      dates.push({ label: `D${limit + 1} (${m}/${d})`, value: `${temp.getFullYear()}-${m}-${d}` });
      temp.setDate(temp.getDate() + 1);
      limit++;
    }
    return dates;
  }, [tripSettings]);

  const getTodayString = () => {
    const d = new Date();
    const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return TRIP_DATES.some(t => t.value === str) ? str : (TRIP_DATES[0]?.value || '');
  };

  const getTripDayId = (dateStr: string): number => {
    const startLocal = new Date(tripSettings.startDate);
    const [y, m, d] = dateStr.split('-').map(Number);
    const diffDays = Math.ceil((new Date(y, m - 1, d).getTime() - startLocal.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays + 1 : 0;
  };

  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('food');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString()); 
  const [payer, setPayer] = useState<string>('u1'); 
  const [splitType, setSplitType] = useState<'split' | 'self' | 'individual'>('split');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [filterDate, setFilterDate] = useState<string | 'all'>('all');
  const [filterPayer, setFilterPayer] = useState<string | 'all'>('all');

  useEffect(() => {
    if (!syncService.isReady()) setFirebaseError(true);
    const savedLocal = localStorage.getItem('bkk_expenses_2025');
    if (savedLocal) try { setExpenses(JSON.parse(savedLocal)); } catch (e) {}
    const savedUsers = localStorage.getItem('bkk_users_2025');
    if (savedUsers) try { 
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
            setUsers(parsed); setPayer(parsed[0].id); setSelectedParticipants(parsed.map(u => u.id));
        }
    } catch (e) {}
    const savedSession = localStorage.getItem('bkk_sync_session');
    if (savedSession) try {
        const { g, p } = JSON.parse(savedSession);
        if (g && p) { setGroupId(g); setPin(p); setTempGroupId(g); setTempPin(p); setIsSyncMode(true); }
    } catch (e) {}
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};
    const setupSync = async () => {
        if (isSyncMode && groupId && pin && syncService.isReady()) {
            setConnectionStatus('啟動中...');
            try {
                unsubscribe = await syncService.subscribe(groupId, pin, 
                    (status) => setConnectionStatus(status),
                    (data) => {
                        setExpenses(data.expenses);
                        if (data.users && data.users.length > 0) setUsers(data.users);
                        if (data.settings) onSettingsSync(data.settings);
                        setConnectionStatus(prev => prev.includes('❌') ? prev : '');
                    }
                );
            } catch (e) { setConnectionStatus('❌ 連線失敗'); }
        } else setConnectionStatus('');
    };
    setupSync();
    return () => unsubscribe();
  }, [isSyncMode, groupId, pin]);

  useEffect(() => {
    if (!isSyncMode) localStorage.setItem('bkk_expenses_2025', JSON.stringify(expenses));
    localStorage.setItem('bkk_users_2025', JSON.stringify(users));
  }, [expenses, users, isSyncMode]);

  const stats = useMemo(() => {
      const unsettledNet: Record<string, number> = {};
      users.forEach(u => unsettledNet[u.id] = 0);
      expenses.filter(e => !e.isSettled).forEach(e => {
          unsettledNet[e.paidBy] += Number(e.amount);
          if (e.splitType === 'split') {
              const participants = e.involvedUsers?.length > 0 ? e.involvedUsers : users.map(u => u.id);
              const share = Number(e.amount) / participants.length;
              participants.forEach(uid => unsettledNet[uid] -= share);
          } else if (e.splitType === 'self') {
              unsettledNet[e.paidBy] -= Number(e.amount);
          } else if (e.splitType === 'individual' && e.individualAmounts) {
              Object.entries(e.individualAmounts).forEach(([uid, amt]) => unsettledNet[uid] -= Number(amt));
          }
      });

      const payers = users.map(u => ({ id: u.id, name: u.name, balance: unsettledNet[u.id] })).filter(x => x.balance < -0.1).sort((a,b) => a.balance - b.balance);
      const receivers = users.map(u => ({ id: u.id, name: u.name, balance: unsettledNet[u.id] })).filter(x => x.balance > 0.1).sort((a,b) => b.balance - a.balance);
      
      const suggestedSettlements: { from: string, to: string, amount: number }[] = [];
      let pi = 0, ri = 0;
      const tempPayers = payers.map(p => ({...p, balance: Math.abs(p.balance)}));
      const tempReceivers = receivers.map(r => ({...r}));

      while(pi < tempPayers.length && ri < tempReceivers.length) {
          const amount = Math.min(tempPayers[pi].balance, tempReceivers[ri].balance);
          suggestedSettlements.push({ from: tempPayers[pi].name, to: tempReceivers[ri].name, amount });
          tempPayers[pi].balance -= amount;
          tempReceivers[ri].balance -= amount;
          if(tempPayers[pi].balance < 0.1) pi++;
          if(tempReceivers[ri].balance < 0.1) ri++;
      }

      const totalCost = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
      const userPaidTotal: Record<string, number> = {};
      const userConsumedTotal: Record<string, number> = {};
      users.forEach(u => { userPaidTotal[u.id] = 0; userConsumedTotal[u.id] = 0; });
      expenses.forEach(e => {
          userPaidTotal[e.paidBy] += Number(e.amount);
          if (e.splitType === 'split') {
              const participants = e.involvedUsers?.length > 0 ? e.involvedUsers : users.map(u => u.id);
              participants.forEach(uid => { if (userConsumedTotal[uid] !== undefined) userConsumedTotal[uid] += Number(e.amount)/participants.length; });
          } else if (e.splitType === 'self') {
              userConsumedTotal[e.paidBy] += Number(e.amount);
          } else if (e.splitType === 'individual' && e.individualAmounts) {
              Object.entries(e.individualAmounts).forEach(([uid, amt]) => { if (userConsumedTotal[uid] !== undefined) userConsumedTotal[uid] += Number(amt); });
          }
      });

      return { totalCost, userPaidTotal, userConsumedTotal, suggestedSettlements, allSettled: !expenses.some(e => !e.isSettled) };
  }, [expenses, users]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => (filterDate === 'all' || e.date === filterDate) && (filterPayer === 'all' || e.paidBy === filterPayer));
  }, [expenses, filterDate, filterPayer]);

  const handleLogin = () => {
      if (!tempGroupId || !tempPin) return;
      setGroupId(tempGroupId); setPin(tempPin); setIsSyncMode(true); setShowAuth(false);
      localStorage.setItem('bkk_sync_session', JSON.stringify({ g: tempGroupId, p: tempPin }));
  };

  const handleLogout = () => {
      if (!window.confirm("確定要登出同步模式嗎？")) return;
      setIsSyncMode(false); setGroupId(''); setPin(''); setConnectionStatus('');
      localStorage.removeItem('bkk_sync_session');
      setExpenses(localStorage.getItem('bkk_expenses_2025') ? JSON.parse(localStorage.getItem('bkk_expenses_2025')!) : []);
  };

  const handleAddUser = async () => {
      if (!newUserName.trim() || users.find(u => u.name === newUserName.trim())) return;
      const newUsers = [...users, { id: `u_${Date.now()}`, name: newUserName.trim() }];
      setUsers(newUsers); setNewUserName('');
      if (isSyncMode && syncService.isReady()) await syncService.updateUsers(groupId, pin, newUsers);
  };

  const handleRemoveUser = async (id: string) => {
      if (users.length <= 1 || expenses.some(e => e.paidBy === id || e.involvedUsers?.includes(id))) { alert("無法移除（至少需一位成員或已有紀錄）"); return; }
      const newUsers = users.filter(u => u.id !== id);
      setUsers(newUsers); if (payer === id) setPayer(newUsers[0].id);
      if (isSyncMode && syncService.isReady()) await syncService.updateUsers(groupId, pin, newUsers);
  };

  const resetForm = () => { setTitle(''); setAmount(''); setEditingId(null); setIsFormExpanded(false); setSplitType('split'); setCustomAmounts({}); setSelectedParticipants(users.map(u => u.id)); setSelectedDate(getTodayString()); };

  const handleEdit = (expense: Expense) => {
      setTitle(expense.title); setAmount(expense.amount.toString()); setCategory(expense.category);
      if (expense.date) setSelectedDate(expense.date); setPayer(expense.paidBy); setSplitType(expense.splitType);
      setSelectedParticipants(expense.involvedUsers || []);
      if (expense.individualAmounts) {
          const ca: Record<string, string> = {};
          Object.entries(expense.individualAmounts).forEach(([uid, amt]) => ca[uid] = amt.toString());
          setCustomAmounts(ca);
      }
      setEditingId(expense.id); setIsFormExpanded(true);
  };

  const toggleParticipant = (uid: string) => setSelectedParticipants(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);

  const handleSave = async () => {
    if (!title || !amount) return;
    const totalVal = parseFloat(amount);
    if (isNaN(totalVal) || totalVal <= 0) return;
    const currentPayerId = payer || users[0].id;
    let finalInvolved = selectedParticipants.length > 0 ? selectedParticipants : [currentPayerId];
    let individualAmountsMap: Record<string, number> | undefined = undefined;

    if (splitType === 'self') finalInvolved = [currentPayerId];
    else if (splitType === 'individual') {
        individualAmountsMap = {}; let sum = 0;
        finalInvolved.forEach(uid => { const val = parseFloat(customAmounts[uid] || '0'); individualAmountsMap![uid] = val; sum += val; });
        if (Math.abs(sum - totalVal) > 0.5) { alert(`總和不符`); return; }
    }

    const payload: Expense = {
      id: editingId || Date.now().toString(), title, amount: totalVal, category, dayId: getTripDayId(selectedDate), date: selectedDate,
      timestamp: editingId ? (expenses.find(e => e.id === editingId)?.timestamp || Date.now()) : Date.now(),
      paidBy: currentPayerId, involvedUsers: finalInvolved, splitType, isSettled: false, individualAmounts: individualAmountsMap
    };

    if (isSyncMode && syncService.isReady()) editingId ? await syncService.updateExpense(groupId, pin, payload) : await syncService.addExpense(groupId, pin, payload);
    else editingId ? setExpenses(prev => prev.map(e => e.id === editingId ? payload : e)) : setExpenses(prev => [payload, ...prev]);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("確定刪除？")) return;
    if (isSyncMode && syncService.isReady()) await syncService.deleteExpense(groupId, pin, id);
    else setExpenses(prev => prev.filter(e => e.id !== id));
    if (editingId === id) resetForm();
  };

  const handleSettleUp = async () => {
      const unsettledIds = expenses.filter(e => !e.isSettled).map(e => e.id);
      if (unsettledIds.length === 0) return;
      if (!window.confirm("⚠️ 確定要結清所有帳務嗎？\n結清後將無法再編輯這些項目的金額。")) return;
      if (isSyncMode && syncService.isReady()) await syncService.settleExpenses(groupId, pin, unsettledIds);
      else setExpenses(prev => prev.map(e => ({ ...e, isSettled: true })));
      setShowDebtDetails(false);
  };

  const handleSimpleCalcInput = (val: string) => {
    if (val === 'C') setSimpleCalcDisplay('');
    else if (val === 'Del') setSimpleCalcDisplay(prev => prev.slice(0, -1));
    else if (val === '=') {
        try {
            // eslint-disable-next-line no-eval
            const result = eval(simpleCalcDisplay);
            setSimpleCalcDisplay(String(result));
        } catch (e) { setSimpleCalcDisplay('Error'); }
    } else setSimpleCalcDisplay(prev => prev + val);
  };

  const calcButtons = [
    { label: 'C', val: 'C', bg: 'bg-red-500/10 text-red-400 hover:bg-red-500/20' },
    { label: 'Del', val: 'Del', bg: 'bg-stone-700 hover:bg-stone-600', icon: Delete },
    { label: '/', val: '/', bg: 'bg-stone-700 hover:bg-stone-600' },
    { label: '*', val: '*', bg: 'bg-stone-700 hover:bg-stone-600' },
    { label: '7', val: '7' }, { label: '8', val: '8' }, { label: '9', val: '9' }, { label: '-', val: '-', bg: 'bg-stone-700 hover:bg-stone-600' },
    { label: '4', val: '4' }, { label: '5', val: '5' }, { label: '6', val: '6' }, { label: '+', val: '+', bg: 'bg-stone-700 hover:bg-stone-600' },
    { label: '1', val: '1' }, { label: '2', val: '2' }, { label: '3', val: '3' }, { label: '=', val: '=', bg: 'bg-orange-600 hover:bg-orange-500 text-white', tall: true },
    { label: '0', val: '0', wide: true }, { label: '.', val: '.' },
  ];

  const closeAllWidgets = () => {
    setShowSimpleCalc(false);
    setShowExchange(false);
    setShowUserManage(false);
    setShowAuth(false);
  };

  return (
    <>
      <button 
        onClick={onRequestOpen} 
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-stone-800 text-white flex items-center justify-center rounded-full shadow-2xl transition-all duration-300 transform ${isOpen ? 'scale-0 opacity-0 translate-y-10' : 'scale-100 opacity-100 translate-y-0'} hover:bg-stone-900 active:scale-90`}
      >
        <Wallet size={24} />
      </button>

      <div className={`fixed inset-y-0 right-0 w-full sm:w-[450px] bg-[#F9F9F7] shadow-2xl z-50 transform transition-transform duration-300 flex flex-col border-l border-stone-200 overscroll-contain ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className={`px-6 pt-6 pb-6 text-white shadow-md relative flex-shrink-0 transition-colors duration-500 ${isSyncMode ? 'bg-emerald-900' : 'bg-stone-900'}`}>
          <div className="flex justify-between items-start relative z-10 mb-2">
              <div>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1">Trip Total Spending</p>
                  <div className="flex items-baseline gap-1">
                      <span className="text-lg font-light opacity-60">NT$</span>
                      <h2 className="text-4xl font-bold tracking-tight">{stats.totalCost.toLocaleString()}</h2>
                  </div>
              </div>
              <div className="flex gap-2">
                  <button onClick={() => { const s = showSimpleCalc; closeAllWidgets(); setShowSimpleCalc(!s); }} className={`p-2 rounded-full transition-colors ${showSimpleCalc ? 'bg-orange-500 text-white' : 'bg-white/10'}`}><Calculator size={20} /></button>
                  <button onClick={() => { const s = showExchange; closeAllWidgets(); setShowExchange(!s); }} className={`p-2 rounded-full transition-colors ${showExchange ? 'bg-orange-500 text-white' : 'bg-white/10'}`}><ArrowRightLeft size={20} /></button>
                  <button onClick={() => { const s = showUserManage; closeAllWidgets(); setShowUserManage(!s); }} className={`p-2 rounded-full transition-colors ${showUserManage ? 'bg-white text-stone-900' : 'bg-white/10'}`}><Users size={20} /></button>
                  {isSyncMode ? <button onClick={handleLogout} className="p-2 rounded-full bg-red-500/20 text-red-200"><LogOut size={20} /></button> : <button onClick={() => { const s = showAuth; closeAllWidgets(); setShowAuth(!s); }} className={`p-2 rounded-full transition-colors ${showAuth ? 'bg-emerald-500 text-white' : 'bg-white/10'}`}><CloudOff size={20} /></button>}
                  <button onClick={onRequestClose} className="p-2 rounded-full bg-white/10"><X size={20} /></button>
              </div>
          </div>

          <div className="relative z-10 mt-4 overflow-x-auto no-scrollbar pb-1">
              <div className="flex gap-3">
                  {users.map(u => (
                      <div key={u.id} className="flex-shrink-0 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-[150px]">
                          <p className="text-xs font-bold text-white tracking-wider flex items-center gap-2 mb-3">
                              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"><User size={10} /></div> {u.name}
                          </p>
                          <div className="space-y-2">
                              <div className="flex flex-col"><span className="text-[10px] text-white/40 uppercase font-bold">先出 (代墊)</span><span className="text-sm font-bold font-mono">NT${(stats.userPaidTotal[u.id] || 0).toLocaleString()}</span></div>
                              <div className="flex flex-col"><span className="text-[10px] text-white/40 uppercase font-bold">個人消費</span><span className="text-sm font-bold font-mono text-white/90">NT${(stats.userConsumedTotal[u.id] || 0).toLocaleString()}</span></div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {users.length > 1 && (
             <div className="mt-4 relative z-10">
                 {!stats.allSettled && stats.suggestedSettlements.length > 0 ? (
                     <div className="bg-white text-stone-900 rounded-xl overflow-hidden shadow-lg animate-fade-in">
                         <button onClick={() => setShowDebtDetails(!showDebtDetails)} className="w-full flex items-center justify-between p-3 hover:bg-stone-50 transition-colors border-b border-stone-100">
                             <div className="flex items-center gap-2">
                                <Info size={14} className="text-orange-500" />
                                <span className="text-xs font-bold uppercase text-stone-500 tracking-wider">有待結算帳務</span>
                             </div>
                             <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                {showDebtDetails ? '隱藏建議' : '查看結算建議'}
                                {showDebtDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                             </div>
                         </button>
                         <div className={`transition-all duration-300 overflow-hidden ${showDebtDetails ? 'max-h-96 opacity-100 p-3' : 'max-h-0 opacity-0'}`}>
                             <div className="space-y-2.5 mb-3">
                                 {stats.suggestedSettlements.map((s, idx) => (
                                     <div key={idx} className="flex justify-between items-center text-xs bg-stone-50 p-2 rounded-lg border border-stone-100">
                                         <div className="flex items-center gap-2">
                                             <span className="font-bold text-stone-700">{s.from}</span>
                                             <ArrowRight size={12} className="text-stone-300" />
                                             <span className="font-bold text-stone-700">{s.to}</span>
                                         </div>
                                         <span className="text-red-600 font-bold font-mono">NT${Math.round(s.amount).toLocaleString()}</span>
                                     </div>
                                 ))}
                             </div>
                             <button onClick={handleSettleUp} className="w-full bg-stone-900 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-stone-700 active:scale-95 transition-all shadow-md">確認已私下結清</button>
                         </div>
                     </div>
                 ) : (
                     <div className="bg-white/10 rounded-xl p-3 flex items-center justify-center gap-2 text-white/80 text-xs border border-white/10"><CheckCircle2 size={14} className="text-emerald-400" /><span className="font-medium">目前帳務已清空</span></div>
                 )}
             </div>
          )}
        </div>

        <div className="relative flex-1 bg-[#F9F9F7]">
          {/* 計算機懸浮視窗 */}
          {showSimpleCalc && (
              <div className="absolute top-4 left-4 right-4 bg-stone-800 rounded-2xl p-4 animate-fade-in z-[60] text-white shadow-2xl border border-stone-700 ring-4 ring-black/5">
                  <div className="flex justify-between items-center mb-3 text-stone-400">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><Calculator size={14} /> Calculator</h4>
                      <button onClick={() => setShowSimpleCalc(false)} className="hover:bg-white/10 p-1 rounded-full"><X size={16} /></button>
                  </div>
                  <div className="bg-stone-900 rounded-lg p-3 mb-3 text-right"><span className="text-2xl font-mono font-bold break-all">{simpleCalcDisplay || '0'}</span></div>
                  <div className="grid grid-cols-4 gap-2">{calcButtons.map(btn => (<button key={btn.val} onClick={() => handleSimpleCalcInput(btn.val)} className={`p-3 rounded-lg font-bold text-lg transition-colors flex items-center justify-center ${btn.wide ? 'col-span-2' : ''} ${(btn as any).tall ? 'row-span-2' : ''} ${btn.bg || 'bg-stone-700/50 hover:bg-stone-700'}`}>{btn.icon ? <btn.icon size={20} /> : btn.label}</button>))}</div>
              </div>
          )}

          {/* 匯率轉換懸浮視窗 */}
          {showExchange && (
              <div className="absolute top-4 left-4 right-4 bg-white rounded-2xl p-4 animate-fade-in z-[60] text-stone-800 shadow-2xl border border-stone-200 ring-4 ring-black/5">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-stone-100">
                      <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2"><ArrowRightLeft size={14} /> Exchange Rate</h4>
                      <button onClick={() => setShowExchange(false)} className="text-stone-300 hover:bg-stone-50 p-1 rounded-full"><X size={16} /></button>
                  </div>
                  <div className="flex gap-2 mb-3">
                      {['THB', 'MYR'].map(c => (
                          <button key={c} onClick={() => setCalcCurrency(c as any)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${calcCurrency === c ? 'bg-orange-100 border-orange-200 text-orange-700' : 'bg-stone-50 border-stone-100 text-stone-400'}`}>{c === 'THB' ? '泰銖' : '馬幣'}</button>
                      ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                      <div><label className="text-[10px] font-bold text-stone-400 uppercase">金額</label><input type="number" value={calcAmount} onChange={e => setCalcAmount(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-2 text-sm font-mono font-bold" placeholder="0" /></div>
                      <div><label className="text-[10px] font-bold text-stone-400 uppercase">匯率</label><input type="number" step="0.1" value={currentRate} onChange={e => handleRateChange(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-2 text-sm font-mono text-stone-500" /></div>
                  </div>
                  <div className="bg-stone-100 rounded-lg p-3 flex justify-between items-center"><span className="text-xs font-bold text-stone-500">約合台幣</span><span className="text-lg font-bold font-mono text-stone-800">NT$ {calculatedTWD.toLocaleString()}</span></div>
              </div>
          )}

          {/* 成員管理懸浮視窗 */}
          {showUserManage && (
              <div className="absolute top-4 left-4 right-4 bg-stone-800 rounded-2xl p-4 animate-fade-in z-[60] text-white shadow-2xl border border-stone-700 ring-4 ring-black/5">
                  <div className="flex justify-between items-center mb-3 text-stone-400">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><Users size={14} /> Members</h4>
                      <button onClick={() => setShowUserManage(false)} className="hover:bg-white/10 p-1 rounded-full"><X size={16} /></button>
                  </div>
                  <div className="space-y-2 mb-4 max-h-[150px] overflow-y-auto no-scrollbar">
                      {users.map(u => (
                          <div key={u.id} className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                              <span className="text-sm font-bold">{u.name}</span>
                              <button onClick={() => handleRemoveUser(u.id)} className="text-white/20 hover:text-red-400 transition-colors"><MinusCircle size={16} /></button>
                          </div>
                      ))}
                  </div>
                  <div className="flex gap-2">
                      <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="新成員名稱" className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30" />
                      <button onClick={handleAddUser} className="bg-white/20 px-3 rounded-lg text-white hover:bg-white/30 transition-colors"><Plus size={18} /></button>
                  </div>
              </div>
          )}

          {/* 雲端同步懸浮視窗 (行為已統一) */}
          {showAuth && (
              <div className="absolute top-4 left-4 right-4 bg-white rounded-2xl p-4 animate-fade-in z-[60] text-stone-800 shadow-2xl border border-stone-200 ring-4 ring-black/5">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-stone-100">
                      <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2"><Cloud size={14} className="text-emerald-600" /> Cloud Sync</h4>
                      <button onClick={() => setShowAuth(false)} className="text-stone-300 hover:bg-stone-50 p-1 rounded-full"><X size={16} /></button>
                  </div>
                  <div className="space-y-3">
                      <div><label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Trip ID</label><input type="text" value={tempGroupId} onChange={e => setTempGroupId(e.target.value)} placeholder="旅程識別碼" className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm" /></div>
                      <div><label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">PIN</label><input type="password" value={tempPin} onChange={e => setTempPin(e.target.value)} placeholder="密碼" className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm" /></div>
                      <button onClick={handleLogin} disabled={firebaseError} className="w-full bg-stone-800 text-white py-3 rounded-xl text-sm font-bold hover:bg-stone-700 shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"><LogIn size={16} /> 開始同步</button>
                  </div>
              </div>
          )}

          <div className="h-full flex flex-col">
            <button onClick={() => (isFormExpanded && editingId ? resetForm() : setIsFormExpanded(!isFormExpanded))} className="w-full bg-white border-b border-stone-100 p-4 flex items-center justify-between hover:bg-stone-50 z-20 sticky top-0 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-full ${isFormExpanded ? (editingId ? 'bg-orange-500 text-white' : 'bg-stone-800 text-white') : 'bg-stone-100 text-stone-400'}`}>{editingId ? <Pencil size={14} /> : <Plus size={14} />}</div>
                    <span className="text-xs font-bold text-stone-700 uppercase tracking-widest">{editingId ? '編輯消費' : (isFormExpanded ? '取消' : '記一筆 (NT$)')}</span>
                </div>
                {isFormExpanded ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
            </button>

            <div className={`bg-white border-b border-stone-100 transition-all duration-300 ease-in-out shadow-sm relative z-10 ${isFormExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="p-4 space-y-5">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2"><label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">消費項目</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="例如：按摩、晚餐..." className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:border-stone-400 outline-none transition-colors" /></div>
                        <div><label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">金額 (NT$)</label><input type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm font-mono focus:border-stone-400 outline-none transition-colors" /></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">日期</label><select value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-400">{TRIP_DATES.map(d => (<option key={d.value} value={d.value}>{d.label}</option>))}</select></div>
                        <div><label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">分類</label><div className="flex gap-2">{CATEGORIES.map(cat => (<button key={cat.id} onClick={() => setCategory(cat.id)} className={`flex-1 p-2 rounded-lg flex items-center justify-center transition-all ${category === cat.id ? `${cat.bg} ${cat.color} border border-current` : 'bg-stone-50 text-stone-300 border border-transparent hover:bg-stone-100'}`}><cat.icon size={18} /></button>))}</div></div>
                    </div>

                    <div className="pt-2"><label className="block text-[10px] font-bold text-stone-400 uppercase mb-2">付款與分帳</label><div className="bg-stone-50 p-4 rounded-xl space-y-4 border border-stone-100"><div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">{users.map(u => (<button key={u.id} onClick={() => setPayer(u.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${payer === u.id ? 'bg-stone-800 text-white border-stone-800 shadow-md scale-105' : 'bg-white text-stone-400 border-stone-200 hover:border-stone-300'}`}><User size={12} /> {u.name} 付帳</button>))}</div><div className="flex gap-2">{[{id:'split', label:'均分'},{id:'self', label:'個人'},{id:'individual', label:'自訂'}].map(t => (<button key={t.id} onClick={() => setSplitType(t.id as any)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${splitType === t.id ? 'bg-white border-stone-800 text-stone-800 shadow-sm' : 'bg-stone-100 border-transparent text-stone-400 hover:bg-stone-200/50'}`}>{t.label}</button>))}</div>{splitType !== 'self' && (<div className="flex flex-wrap gap-2 pt-2">{users.map(u => (<button key={u.id} onClick={() => toggleParticipant(u.id)} className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${selectedParticipants.includes(u.id) ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-stone-100 border-transparent text-stone-300 opacity-50'}`}>{selectedParticipants.includes(u.id) ? <Check size={10}/> : <X size={10}/>} {u.name}</button>))}</div>)}{splitType === 'individual' && (<div className="space-y-2 pt-2 border-t border-stone-200/50">{users.filter(u => selectedParticipants.includes(u.id)).map(u => (<div key={u.id} className="flex items-center justify-between text-xs font-bold text-stone-600"><span>{u.name} 分擔</span><div className="flex items-center gap-2"><span className="text-[10px] opacity-40">NT$</span><input type="number" value={customAmounts[u.id] || ''} onChange={e => setCustomAmounts({...customAmounts, [u.id]: e.target.value})} className="w-20 bg-white border border-stone-200 rounded px-2 py-1 text-right focus:outline-none focus:border-stone-400" placeholder="0" /></div></div>))}</div>)}</div></div>
                    <button onClick={handleSave} className="w-full bg-stone-800 text-white py-3.5 rounded-xl font-bold hover:bg-stone-700 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">{editingId ? '更新紀錄' : '儲存紀錄'}</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="p-4 space-y-4 pb-32">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                      <button onClick={() => setFilterDate('all')} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${filterDate === 'all' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-400 border-stone-200'}`}>全部日期</button>
                      {TRIP_DATES.map(d => (<button key={d.value} onClick={() => setFilterDate(d.value)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${filterDate === d.value ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-400 border-stone-200'}`}>{d.label}</button>))}
                  </div>

                  <div className="space-y-3">
                      {filteredExpenses.length === 0 ? (
                          <div className="py-20 text-center text-stone-300"><Wallet size={48} className="mx-auto mb-3 opacity-20"/><p className="text-sm font-medium tracking-wide">尚無消費紀錄</p></div>
                      ) : (
                          filteredExpenses.map(exp => {
                              const cat = CATEGORIES.find(c => c.id === exp.category) || CATEGORIES[3];
                              return (
                                  <div key={exp.id} className={`bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex items-center gap-4 group relative transition-all ${exp.isSettled ? 'opacity-60' : 'hover:border-stone-300'}`}>
                                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.bg} ${cat.color}`}><cat.icon size={20} /></div>
                                      <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-0.5"><h4 className="font-bold text-stone-800 text-sm">{exp.title}</h4>{exp.isSettled && <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">已結清</span>}</div>
                                          <div className="flex items-center gap-2 text-[10px] text-stone-400 font-bold uppercase tracking-wide"><span>{exp.date ? TRIP_DATES.find(d => d.value === exp.date)?.label : `DAY ${exp.dayId}`}</span><span>•</span><span className="flex items-center gap-1 text-stone-500 font-black"><User size={10}/> {users.find(u => u.id === exp.paidBy)?.name}</span></div>
                                      </div>
                                      <div className="text-right">
                                          <div className="text-sm font-black text-stone-800 font-mono">NT${exp.amount.toLocaleString()}</div>
                                          {exp.splitType === 'split' && <div className="text-[10px] text-stone-300 font-bold">與 {exp.involvedUsers.length} 人均分</div>}
                                      </div>
                                      {!exp.isSettled && (
                                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button onClick={() => handleEdit(exp)} className="p-1.5 text-stone-300 hover:text-stone-800 transition-colors"><Pencil size={12}/></button>
                                              <button onClick={() => handleDelete(exp.id)} className="p-1.5 text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={12}/></button>
                                          </div>
                                      )}
                                  </div>
                              );
                          })
                      )}
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {isOpen && <div className="fixed inset-0 bg-stone-900/10 backdrop-blur-[2px] z-40 sm:hidden" onClick={onRequestClose} />}
    </>
  );
});

ExpenseTracker.displayName = 'ExpenseTracker';
export default ExpenseTracker;
