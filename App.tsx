import React, { useState } from 'react';
import { ITINERARY_DATA } from './constants';
import { DayPlan, ViewState } from './types';
import ItineraryCard from './components/ItineraryCard';
import DayDetail from './components/DayDetail';
import ExpenseTracker from './components/ExpenseTracker';
import { MapPin } from 'lucide-react';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.LIST);
  const [selectedDay, setSelectedDay] = useState<DayPlan | null>(null);

  const handleDayClick = (day: DayPlan) => {
    setSelectedDay(day);
    setViewState(ViewState.DETAIL);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setViewState(ViewState.LIST);
    setTimeout(() => setSelectedDay(null), 300); // Clear after transition
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
      <ExpenseTracker />
    </div>
  );
};

export default App;
