import React, { useState, useEffect } from 'react';
import { ITINERARY_DATA } from './constants';
import { DayPlan, ViewState } from './types';
import ItineraryCard from './components/ItineraryCard';
import DayDetail from './components/DayDetail';
import ExpenseTracker from './components/ExpenseTracker';
import { MapPin } from 'lucide-react';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.LIST);
  const [selectedDay, setSelectedDay] = useState<DayPlan | null>(null);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);

  // 監聽瀏覽器的「上一頁」動作 (包含手機滑動手勢)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Layer 1: Expense Tracker (Topmost)
      // 如果記帳頁面開著，優先只關閉記帳頁面
      if (isExpenseOpen) {
        setIsExpenseOpen(false);
        return; 
      }

      // Layer 2: Day Detail
      // 如果記帳頁面沒開，但詳情頁開著，則關閉詳情頁
      if (viewState === ViewState.DETAIL) {
        setViewState(ViewState.LIST);
        setTimeout(() => setSelectedDay(null), 300); // 動畫結束後清除資料
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isExpenseOpen, viewState]); // 依賴項很重要，確保讀取到最新的 state

  const handleDayClick = (day: DayPlan) => {
    // 告訴瀏覽器：「我們進入下一頁囉」
    window.history.pushState({ view: 'detail', dayId: day.id }, '', `#day${day.id}`);
    
    setSelectedDay(day);
    setViewState(ViewState.DETAIL);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    // 點擊 UI 返回按鈕時，呼叫 browser back 觸發 popstate
    window.history.back();
  };

  // 記帳本 History 邏輯
  const openExpenseTracker = () => {
    window.history.pushState({ view: 'expense' }, '', '#expenses');
    setIsExpenseOpen(true);
  };

  const closeExpenseTracker = () => {
    // 點擊關閉按鈕時，呼叫 browser back
    // 這會觸發上面的 popstate，進而執行 setIsExpenseOpen(false)
    window.history.back();
  };

  return (
    <div className="min-h-screen font-sans text-stone-800">
      {/* Minimalist Header */}
      {viewState === ViewState.LIST && (
        <header className="sticky top-0 z-30 bg-[#F9F9F7]/90 backdrop-blur-sm border-b border-gray-100">
            <div className="max-w-2xl mx-auto px-6 h-20 flex items-center justify-center relative">
            <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-1">Travel Guide</span>
                <h1 className="text-xl font-bold text-stone-800 tracking-wide">
                BANGKOK BLISS
                </h1>
            </div>
            </div>
        </header>
      )}

      {/* Main Content */}
      <main className="max-w-2xl mx-auto min-h-[calc(100vh-80px)]">
        {viewState === ViewState.LIST ? (
          <div className="px-6 py-8 animate-fade-in">
             <div className="mb-10 text-center">
                <p className="text-stone-500 font-light leading-relaxed text-sm max-w-sm mx-auto">
                    A curated journey through culture, flavors, and hidden gems in the heart of Thailand.
                </p>
             </div>
            
            <div className="grid grid-cols-1 gap-6">
              {ITINERARY_DATA.map((day) => (
                <ItineraryCard
                  key={day.id}
                  plan={day}
                  onClick={() => handleDayClick(day)}
                />
              ))}
            </div>
            
            <div className="mt-16 text-center">
                <div className="w-8 h-px bg-stone-300 mx-auto mb-4"></div>
                <p className="text-[10px] text-stone-400 uppercase tracking-widest">
                    Design by Gemini • 2025
                </p>
            </div>
          </div>
        ) : (
          selectedDay && (
            <DayDetail 
              plan={selectedDay} 
              onBack={handleBack} 
            />
          )
        )}
      </main>

      {/* Expense Tracker */}
      <ExpenseTracker 
        isOpen={isExpenseOpen}
        onRequestOpen={openExpenseTracker}
        onRequestClose={closeExpenseTracker}
      />
    </div>
  );
};

export default App;