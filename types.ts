
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
  image: string; // Specific image URL for the day
  imgPos?: string; // CSS object-position value (e.g., 'center 20%')
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

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: 'food' | 'shopping' | 'transport' | 'other';
  dayId: number; // 0 for general, 1-6 for specific days
  date?: string; // YYYY-MM-DD format
  timestamp: number;
  paidBy: string; // The ID of the user who paid
  involvedUsers: string[]; // List of User IDs who share this expense
  splitType: 'split' | 'self' | 'other'; // split=Equal split among involved, self=Payer only
  isSettled: boolean; // Has this been paid back?
}

export enum ViewState {
  LIST = 'LIST',
  DETAIL = 'DETAIL'
}