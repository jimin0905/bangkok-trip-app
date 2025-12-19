
export type ActivityCategory = 'sightseeing' | 'food' | 'shopping' | 'transport' | 'relax' | 'other';

export interface SmartTag {
  label: string;
  type: 'must-eat' | 'must-buy' | 'reservation' | 'tip' | 'nav';
}

export interface Activity {
  time: string;
  title: string;
  description?: string;
  location?: string;
  category: ActivityCategory;
  tags?: SmartTag[];
}

export interface DayPlan {
  id: number;
  dateLabel: string;
  title: string;
  subtitle: string;
  image: string;
  imgPos?: string;
  activities: Activity[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  sources?: { uri: string; title: string }[];
}

export interface UserProfile {
  id: string;
  name: string;
}

export interface TripSettings {
  startDate: string;
  endDate: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: 'food' | 'shopping' | 'transport' | 'other';
  dayId: number;
  date?: string;
  timestamp: number;
  paidBy: string;
  involvedUsers: string[];
  individualAmounts?: Record<string, number>;
  splitType: 'split' | 'self' | 'individual';
  isSettled: boolean;
}

export enum ViewState {
  LIST = 'LIST',
  DETAIL = 'DETAIL'
}
