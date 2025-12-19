
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ITINERARY_DATA } from './constants';
import { DayPlan, ViewState, TripSettings } from './types';
import ItineraryCard from './components/ItineraryCard';
import DayDetail from './components/DayDetail';
import ExpenseTracker from './components/ExpenseTracker';
import { Settings, Calendar, Save, X } from 'lucide-react';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.LIST);
  const [selectedDay, setSelectedDay] = useState<DayPlan | null>(null);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [tripSettings, setTripSettings] = useState<TripSettings>(() => {
    const saved = localStorage.getItem('bkk_trip_settings');
    return saved ? JSON.parse(saved) : { startDate: '2025-12-24', endDate: '2025-12-29' };
  });

  const [tempSettings, setTempSettings] = useState<TripSettings>(tripSettings);
  const expenseTrackerRef = useRef<{ pushSettings: (settings: TripSettings) => Promise<void> } | null>(null);

  useEffect(() => {
    localStorage.setItem('bkk_trip_settings', JSON.stringify(tripSettings));
  }, [tripSettings]);

  const dynamicItinerary = useMemo(() => {
    return ITINERARY_DATA.map((day, index) => {
      const start = new Date(tripSettings.startDate);
      const current = new Date(start);
      current.setDate(start.getDate() + index);
      
      const month = current.getMonth() + 1;
      const date = current.getDate();
      const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
      const weekDay = weekDays[current.getDay()];
      
      return {
        ...day,
        dateLabel: `Day ${index + 1} • ${month}/${date} (${weekDay})`
      };
    });
  }, [tripSettings]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (isExpenseOpen) {
        setIsExpenseOpen(false);
        return;
      }
      if (viewState === ViewState.DETAIL) {
        setViewState(ViewState.LIST);
        setSelectedDay(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isExpenseOpen, viewState]);

  const safePushState = (state: any, hash: string) => {
    try {
        window.history.pushState(state, '', hash);
    } catch (e) {
        try {
            window.history.pushState(state, '', null);
        } catch (e2) {}
    }
  };

  const handleDayClick = (day: DayPlan) => {
    setSelectedDay(day);
    setViewState(ViewState.DETAIL);
    window.scrollTo({ top: 0, behavior: 'auto' });
    safePushState({ view: 'detail', dayId: day.id }, `#day${day.id}`);
  };

  const handleBack = () => window.history.back();
  const openExpenseTracker = () => {
    setIsExpenseOpen(true);
    safePushState({ view: 'expense' }, '#expenses');
  };
  const closeExpenseTracker = () => window.history.back();

  const handleSaveSettings = async () => {
    setTripSettings(tempSettings);
    // 如果雲端同步已啟動，則推送到 Firebase
    if (expenseTrackerRef.current) {
      await expenseTrackerRef.current.pushSettings(tempSettings);
    }
    setIsSettingsOpen(false);
  };

  return (
    <div className="min-h-screen font-sans text-stone-800 bg-[#F9F9F7]">
      {/* Header */}
      {viewState === ViewState.LIST && (
        <header className="sticky top-0 z-30 bg-[#F9F9F7]/95 backdrop-blur-sm border-b border-gray-100/50">
            <div className="max-w-2xl mx-auto px-6 h-20 flex items-center justify-between relative">
                <div className="w-10"></div>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-1">Travel Guide</span>
                    <h1 className="text-xl font-bold text-stone-800 tracking-wide font-serif">
                    BANGKOK BLISS
                    </h1>
                </div>
                <button 
                  onClick={() => { setTempSettings(tripSettings); setIsSettingsOpen(true); }}
                  className="p-2 text-stone-400 hover:text-stone-800 transition-colors"
                >
                  <Settings size={20} />
                </button>
            </div>
        </header>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}></div>
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative z-10 overflow-hidden">
            <div className="bg-stone-800 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><Calendar size={18} /> 旅程日期設定</h3>
              <button onClick={() => setIsSettingsOpen(false)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">開始日期</label>
                <input 
                  type="date" 
                  value={tempSettings.startDate}
                  onChange={(e) => setTempSettings({ ...tempSettings, startDate: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">結束日期</label>
                <input 
                  type="date" 
                  value={tempSettings.endDate}
                  onChange={(e) => setTempSettings({ ...tempSettings, endDate: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-sm font-bold"
                />
              </div>
              <button 
                onClick={handleSaveSettings}
                className="w-full bg-stone-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-stone-700 transition-all shadow-md active:scale-95"
              >
                <Save size={18} /> 儲存設定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto min-h-[calc(100vh-80px)]">
        {viewState === ViewState.LIST ? (
          <div className="px-6 py-8 animate-fade-in">
             <div className="mb-10 text-center">
                <p className="text-stone-500 font-light leading-relaxed text-sm max-w-sm mx-auto">
                    A curated journey through culture, flavors, and hidden gems in the heart of Thailand.
                </p>
             </div>
            
            <div className="grid grid-cols-1 gap-6 pb-20">
              {dynamicItinerary.map((day) => (
                <ItineraryCard
                  key={day.id}
                  plan={day}
                  onClick={() => handleDayClick(day)}
                />
              ))}
            </div>
          </div>
        ) : (
          selectedDay && (
            <DayDetail 
              plan={{
                ...selectedDay,
                dateLabel: dynamicItinerary.find(d => d.id === selectedDay.id)?.dateLabel || selectedDay.dateLabel
              }} 
              onBack={handleBack} 
            />
          )
        )}
      </main>

      <ExpenseTracker 
        ref={expenseTrackerRef}
        isOpen={isExpenseOpen}
        onRequestOpen={openExpenseTracker}
        onRequestClose={closeExpenseTracker}
        tripSettings={tripSettings}
        onSettingsSync={(cloudSettings) => setTripSettings(cloudSettings)}
      />
    </div>
  );
};

export default App;
