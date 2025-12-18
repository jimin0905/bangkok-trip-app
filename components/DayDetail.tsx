import React, { useState } from 'react';
import { DayPlan, ActivityCategory, SmartTag } from '../types';
import { ArrowLeft, MapPin, Clock, Utensils, Camera, ShoppingBag, Bus, CloudSun, ImageOff } from 'lucide-react';

interface Props {
  plan: DayPlan;
  onBack: () => void;
}

const CategoryIcon: React.FC<{ category: ActivityCategory }> = ({ category }) => {
    switch (category) {
        case 'food': return <Utensils size={16} className="text-orange-700" />;
        case 'sightseeing': return <Camera size={16} className="text-emerald-700" />;
        case 'shopping': return <ShoppingBag size={16} className="text-purple-700" />;
        case 'transport': return <Bus size={16} className="text-blue-700" />;
        default: return <Clock size={16} className="text-gray-500" />;
    }
};

const TagBadge: React.FC<{ tag: SmartTag }> = ({ tag }) => {
    let styles = "bg-gray-100 text-gray-600";
    if (tag.type === 'must-eat') styles = "bg-orange-50 text-orange-700 border border-orange-100";
    if (tag.type === 'must-buy') styles = "bg-purple-50 text-purple-700 border border-purple-100";
    if (tag.type === 'reservation') styles = "bg-red-50 text-red-700 border border-red-100 font-medium";
    if (tag.type === 'tip') styles = "bg-blue-50 text-blue-700 border border-blue-100";

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs tracking-wide ${styles}`}>
            {tag.label}
        </span>
    );
};

// Weather data for Dec 24 - Dec 29
const getWeatherForecast = (dayId: number) => {
    switch(dayId) {
        case 1: return "☀️ 12/24 (三) 晴時多雲，24-32°C。平安夜抵達，天氣舒適，適合短袖搭配薄外套。";
        case 2: return "☀️ 12/25 (四) 晴朗炎熱，25-33°C。聖誕節戶外行程多，注意防曬與補充水分。";
        case 3: return "🌤️ 12/26 (五) 多雲時晴，26-34°C。百貨商圈冷氣較強，建議攜帶薄外套。";
        case 4: return "☁️ 12/27 (六) 多雲偶雨，25-33°C。Siam 商圈人潮多，天氣悶熱，建議穿著輕便。";
        case 5: return "☀️ 12/28 (日) 晴時多雲，24-32°C。恰圖恰市集非常炎熱，務必穿著透氣並隨時補充水分。";
        case 6: return "🌤️ 12/29 (一) 晴朗舒適，23-32°C。返程日建議穿著寬鬆舒適，並準備外套應對機場溫差。";
        default: return "☀️ 曼谷12月為涼季，平均氣溫 24-32°C，氣候乾爽舒適，適合旅遊。";
    }
};

const DayDetail: React.FC<Props> = ({ plan, onBack }) => {
  const [imgError, setImgError] = useState(false);
  const weatherInfo = getWeatherForecast(plan.id);

  return (
    <div className="animate-fade-in pb-24 bg-[#F9F9F7] min-h-screen">
      {/* Minimal Header */}
      <div className="sticky top-0 z-30 bg-[#F9F9F7]/90 backdrop-blur-sm border-b border-gray-200/50 px-4 h-16 flex items-center justify-between">
        <button 
            onClick={onBack}
            className="p-2 -ml-2 text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
        >
            <ArrowLeft size={22} />
        </button>
        <div className="font-serif font-bold text-stone-800 tracking-wider">
            {plan.dateLabel}
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Hero Image */}
      <div className="px-4 mt-4">
        <div className="relative h-48 sm:h-64 w-full rounded-2xl overflow-hidden shadow-sm bg-stone-200">
            {!imgError ? (
                <img 
                    src={plan.image} 
                    alt={plan.title} 
                    onError={() => setImgError(true)}
                    style={{ objectPosition: plan.imgPos || 'center' }}
                    className="w-full h-full object-cover grayscale-[10%]"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center flex-col text-stone-400 gap-2">
                    <ImageOff size={32} opacity={0.5} />
                    <span className="text-xs font-medium">Image not available</span>
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
                <h1 className="text-2xl font-bold tracking-wide">{plan.title}</h1>
                <p className="text-white/80 text-sm font-light">{plan.subtitle}</p>
            </div>
        </div>
      </div>

      {/* Static Weather Widget */}
      <div className="px-4 mt-6">
        <div className="bg-white rounded-xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-stone-100 flex items-start gap-3">
            <div className="bg-blue-50 p-2 rounded-full text-blue-500 mt-0.5">
                <CloudSun size={18} />
            </div>
            <div className="flex-1">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">
                    Weather Forecast
                </h4>
                <p className="text-sm text-stone-700 leading-relaxed font-medium">
                    {weatherInfo}
                </p>
            </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-2xl mx-auto px-4 mt-8">
        <div className="space-y-6">
          {plan.activities.map((activity, index) => (
            <div key={index} className="flex gap-4">
              {/* Time Column */}
              <div className="flex flex-col items-center min-w-[3.5rem] pt-1">
                <span className="text-xs font-medium text-stone-400 mb-2">{activity.time}</span>
                <div className="flex-1 w-px bg-stone-200 relative">
                    {/* Timeline Node */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-stone-300 border-2 border-[#F9F9F7]" />
                </div>
              </div>

              {/* Card */}
              <div className="flex-1 pb-6">
                <div className="bg-white rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)] border border-stone-50">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${
                                activity.category === 'food' ? 'bg-orange-50' : 
                                activity.category === 'sightseeing' ? 'bg-emerald-50' : 
                                activity.category === 'shopping' ? 'bg-purple-50' : 'bg-stone-50'
                            }`}>
                                <CategoryIcon category={activity.category} />
                            </div>
                            <h3 className="text-base font-bold text-stone-800">
                                {activity.title}
                            </h3>
                        </div>
                    </div>

                    <p className="text-sm text-stone-600 leading-relaxed mb-3">
                        {activity.description}
                    </p>

                    {/* Smart Tags */}
                    {activity.tags && activity.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {activity.tags.map((tag, i) => (
                                <TagBadge key={i} tag={tag} />
                            ))}
                        </div>
                    )}

                    {/* Navigation Button */}
                    {activity.location && (
                        <div className="border-t border-stone-50 pt-3 flex justify-end">
                            <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs rounded-full transition-all shadow-sm active:scale-95"
                            >
                                <MapPin size={12} />
                                <span>查看地圖</span>
                            </a>
                        </div>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DayDetail;