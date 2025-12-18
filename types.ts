export type ActivityCategory = 'sightseeing' | 'food' | 'shopping' | 'transport' | 'relax' | 'other';

export interface SmartTag {
  label: string;
  type: 'must-eat' | 'must-buy' | 'reservation' | 'tip' | 'nav';
}

export interface Activity {
  time: string;
  title: string;
  description?: string;
  location?: string; // For Google Maps query
  category: ActivityCategory;
  tags?: SmartTag[];
}

export interface DayPlan {
  id: number;
  dateLabel: string;
  title: string;
  subtitle: string;
  activities: Activity[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  sources?: { uri: string; title: string }[];
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: 'food' | 'shopping' | 'transport' | 'other';
  dayId: number; // 0 for general, 1-6 for specific days
  timestamp: number;
  paidBy: 'A' | 'B'; // Who paid?
  splitType: 'split' | 'self' | 'other'; // split=50/50, self=payer owns all, other=payer paid for other
  isSettled: boolean; // Has this been paid back?
}

export enum ViewState {
  LIST = 'LIST',
  DETAIL = 'DETAIL'
}