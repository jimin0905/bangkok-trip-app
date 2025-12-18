import React, { useState, useEffect } from 'react';
import { ITINERARY_DATA } from './constants';
import { DayPlan, ViewState } from './types';
import ItineraryCard from './components/ItineraryCard';
import DayDetail from './components/DayDetail';
import ExpenseTracker from './components/ExpenseTracker';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.LIST);
  const [selectedDay, setSelectedDay] = useState<DayPlan | null>(null);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // 1. Close Expense Tracker if open
      if (isExpenseOpen) {
        setIsExpenseOpen(false);
        return;
      }
      // 2. Return to List if in Detail view
      if (viewState === ViewState.DETAIL) {
        setViewState(ViewState.LIST);
        setSelectedDay(null); // Clear immediately for snappier feel
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isExpenseOpen, viewState]);

  // Safe history push wrapper
  const safePushState = (state: any, hash: string) => {
    try {
        // Try standard push with hash
        window.history.pushState(state, '', hash);
    } catch (e) {
        console.warn("History push with URL failed, retrying without URL:", e);
        try {
            // Fallback: push state without URL (works in blob/sandboxed envs)
            window.history.pushState(state, '', null);
        } catch (e2) {
            console.error("History API unavailable:", e2);
        }
    }
  };

  const handleDayClick = (day: DayPlan) => {
    // 1. Update React state FIRST to ensure UI responsiveness regardless of history API status
    setSelectedDay(day);
    setViewState(ViewState.DETAIL);
    window.scrollTo({ top: 0, behavior: 'auto' });

    // 2. Push state to history safely
    safePushState({ view: 'detail', dayId: day.id }, `#day${day.id}`);
  };

  const handleBack = () => {
    // If history API is working, this triggers popstate.
    // In extremely restricted envs where pushState completely fails, this might exit app,
    // but the fallback in safePushState usually prevents that.
    window.history.back();
  };

  const openExpenseTracker = () => {
    // Update state first
    setIsExpenseOpen(true);
    // Then history
    safePushState({ view: 'expense' }, '#expenses');
  };

  const closeExpenseTracker = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen font-sans text-stone-800 bg-[#F9F9F7]">
      {/* Header - Only visible in List View */}
      {viewState === ViewState.LIST && (
        <header className="sticky top-0 z-30 bg-[#F9F9F7]/95 backdrop-blur-sm border-b border-gray-100/50">
            <div className="max-w-2xl mx-auto px-6 h-20 flex items-center justify-center relative">
            <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-1">Travel Guide</span>
                <h1 className="text-xl font-bold text-stone-800 tracking-wide font-serif">
                BANGKOK BLISS
                </h1>
            </div>
            </div>
        </header>
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
              {ITINERARY_DATA.map((day) => (
                <ItineraryCard
                  key={day.id}
                  plan={day}
                  onClick={() => handleDayClick(day)}
                />
              ))}
            </div>
            
            <div className="mt-8 text-center pb-8">
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

      {/* Expense Tracker Overlay */}
      <ExpenseTracker 
        isOpen={isExpenseOpen}
        onRequestOpen={openExpenseTracker}
        onRequestClose={closeExpenseTracker}
      />
    </div>
  );
};

export default App;