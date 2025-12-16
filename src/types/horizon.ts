// Core data types for Horizon

export type GoalCategory = 'relationship' | 'kids' | 'health' | 'work' | 'self';

export interface Goal {
  id: string;
  userId: string;
  name: string;
  category: GoalCategory;
  targetAmount: number;
  currentAmount: number;
  unit: 'sessions' | 'hours';
  // Ramping configuration
  rampingEnabled: boolean;
  startAmount?: number;
  rampWeeks?: number;
  currentWeek?: number;
  createdAt: Date;
}

export interface GoalActivity {
  id: string;
  goalId: string;
  userId: string;
  amount: number;
  note?: string;
  loggedAt: Date;
}

export type RelationshipType = 'partner' | 'child' | 'parent' | 'sibling' | 'friend' | 'other';

export interface Person {
  id: string;
  userId: string;
  name: string;
  relationship: RelationshipType;
  interests: string[];
  notes?: string;
  location?: string;
  avatarUrl?: string;
  createdAt: Date;
}

export interface ImportantDate {
  id: string;
  personId: string;
  userId: string;
  title: string;
  date: Date;
  isRecurring: boolean;
  reminderDays?: number;
}

export interface TimeAwareness {
  personId: string;
  personName: string;
  relationship: RelationshipType;
  daysSinceLastActivity: number;
  lastActivityDate?: Date;
  suggestedAction?: string;
}

export interface WeeklySummary {
  weekStart: Date;
  weekEnd: Date;
  goalsProgress: {
    goalId: string;
    goalName: string;
    category: GoalCategory;
    target: number;
    achieved: number;
    percentComplete: number;
  }[];
  timeAwareness: TimeAwareness[];
  aiInsight?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  city?: string;
  timezone?: string;
  workHoursStart?: string;
  workHoursEnd?: string;
  priorityAreas: GoalCategory[];
  onboardingComplete: boolean;
  createdAt: Date;
}

export interface Perk {
  id: string;
  title: string;
  description: string;
  category: 'fitness' | 'dining' | 'kids' | 'wellness' | 'experiences';
  imageUrl?: string;
  link: string;
  discount?: string;
}
