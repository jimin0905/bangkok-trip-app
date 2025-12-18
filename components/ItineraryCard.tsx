import React from 'react';
import { DayPlan } from '../types';
import { Calendar, ChevronRight } from 'lucide-react';

interface Props {
  plan: DayPlan;
  onClick: () => void;
}

const ItineraryCard: React.FC<Props> = ({ plan, onClick }) => {
  const imageUrl = `https://picsum.photos/seed/bkk${plan.id}/600/400`;

  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-xl overflow-hidden border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-500 flex flex-col h-full"
    >
      {/* Image Section - Reduced height for minimalist feel */}
      <div className="relative h-40 overflow-hidden">
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500 z-10" />
        <img 
          src={imageUrl} 
          alt={plan.title} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 grayscale-[20%] group-hover:grayscale-0"
        />
        <div className="absolute top-3 left-3 z-20">
             <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-sm text-xs font-serif tracking-widest text-gray-800 shadow-sm">
                {plan.dateLabel}
             </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
            <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-stone-600 transition-colors tracking-wide">
            {plan.title}
            </h3>
            <p className="text-sm text-gray-500 font-light mb-4">
            {plan.subtitle}
            </p>
        </div>
        
        <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-2">
            <div className="flex items-center text-xs text-gray-400 font-medium">
                <Calendar size={12} className="mr-1.5" />
                <span>{plan.activities.length} 個行程</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-gray-400 group-hover:bg-stone-800 group-hover:text-white transition-all duration-300">
                <ChevronRight size={14} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryCard;