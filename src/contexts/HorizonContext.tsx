import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Goal, Person, ImportantDate, TimeAwareness, GoalActivity, User } from '@/types/horizon';

// Demo data for MVP
const demoUser: User = {
  id: '1',
  email: 'demo@horizon.app',
  name: 'Alex',
  city: 'San Francisco',
  timezone: 'America/Los_Angeles',
  workHoursStart: '09:00',
  workHoursEnd: '18:00',
  priorityAreas: ['relationship', 'kids', 'health'],
  onboardingComplete: true,
  createdAt: new Date(),
};

const demoGoals: Goal[] = [
  {
    id: '1',
    userId: '1',
    name: 'Date night',
    category: 'relationship',
    targetAmount: 1,
    currentAmount: 0,
    unit: 'sessions',
    rampingEnabled: false,
    createdAt: new Date(),
  },
  {
    id: '2',
    userId: '1',
    name: 'Quality time with kids',
    category: 'kids',
    targetAmount: 5,
    currentAmount: 3,
    unit: 'hours',
    rampingEnabled: true,
    startAmount: 2,
    rampWeeks: 8,
    currentWeek: 4,
    createdAt: new Date(),
  },
  {
    id: '3',
    userId: '1',
    name: 'Exercise',
    category: 'health',
    targetAmount: 4,
    currentAmount: 2,
    unit: 'sessions',
    rampingEnabled: true,
    startAmount: 2,
    rampWeeks: 6,
    currentWeek: 1,
    createdAt: new Date(),
  },
];

const demoPeople: Person[] = [
  {
    id: '1',
    userId: '1',
    name: 'Sarah',
    relationship: 'partner',
    interests: ['hiking', 'wine tasting', 'cooking', 'travel'],
    notes: 'Loves surprise coffee dates',
    createdAt: new Date(),
  },
  {
    id: '2',
    userId: '1',
    name: 'Emma',
    relationship: 'child',
    interests: ['dinosaurs', 'art', 'swimming'],
    notes: 'Currently obsessed with T-Rex',
    createdAt: new Date(),
  },
  {
    id: '3',
    userId: '1',
    name: 'Liam',
    relationship: 'child',
    interests: ['legos', 'space', 'soccer'],
    notes: 'Wants to be an astronaut',
    createdAt: new Date(),
  },
];

const demoImportantDates: ImportantDate[] = [
  {
    id: '1',
    personId: '1',
    userId: '1',
    title: 'Anniversary',
    date: new Date(2024, 5, 15),
    isRecurring: true,
    reminderDays: 14,
  },
  {
    id: '2',
    personId: '2',
    userId: '1',
    title: "Emma's Birthday",
    date: new Date(2024, 2, 22),
    isRecurring: true,
    reminderDays: 30,
  },
];

// Calculate days since last activity (demo calculation)
const calculateTimeAwareness = (people: Person[]): TimeAwareness[] => {
  return people.map((person) => {
    // Demo: random days for illustration
    const daysSince = person.relationship === 'partner' ? 12 : 
                      person.relationship === 'child' ? 3 : 21;
    
    return {
      personId: person.id,
      personName: person.name,
      relationship: person.relationship,
      daysSinceLastActivity: daysSince,
      lastActivityDate: new Date(Date.now() - daysSince * 24 * 60 * 60 * 1000),
    };
  });
};

interface HorizonContextType {
  user: User | null;
  goals: Goal[];
  people: Person[];
  importantDates: ImportantDate[];
  timeAwareness: TimeAwareness[];
  isOnboarding: boolean;
  setIsOnboarding: (value: boolean) => void;
  updateGoalProgress: (goalId: string, amount: number) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'currentAmount'>) => void;
  addPerson: (person: Omit<Person, 'id' | 'userId' | 'createdAt'>) => void;
  getCurrentRampedTarget: (goal: Goal) => number;
}

const HorizonContext = createContext<HorizonContextType | undefined>(undefined);

export function HorizonProvider({ children }: { children: ReactNode }) {
  const [user] = useState<User | null>(demoUser);
  const [goals, setGoals] = useState<Goal[]>(demoGoals);
  const [people, setPeople] = useState<Person[]>(demoPeople);
  const [importantDates] = useState<ImportantDate[]>(demoImportantDates);
  const [isOnboarding, setIsOnboarding] = useState(false);

  const timeAwareness = calculateTimeAwareness(people);

  const updateGoalProgress = (goalId: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g
      )
    );
  };

  const addGoal = (goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'currentAmount'>) => {
    const newGoal: Goal = {
      ...goal,
      id: Date.now().toString(),
      userId: user?.id || '1',
      currentAmount: 0,
      createdAt: new Date(),
    };
    setGoals((prev) => [...prev, newGoal]);
  };

  const addPerson = (person: Omit<Person, 'id' | 'userId' | 'createdAt'>) => {
    const newPerson: Person = {
      ...person,
      id: Date.now().toString(),
      userId: user?.id || '1',
      createdAt: new Date(),
    };
    setPeople((prev) => [...prev, newPerson]);
  };

  // Calculate current ramped target based on week
  const getCurrentRampedTarget = (goal: Goal): number => {
    if (!goal.rampingEnabled || !goal.startAmount || !goal.rampWeeks || !goal.currentWeek) {
      return goal.targetAmount;
    }
    
    const increment = (goal.targetAmount - goal.startAmount) / goal.rampWeeks;
    const currentTarget = goal.startAmount + (increment * goal.currentWeek);
    return Math.round(currentTarget * 10) / 10; // Round to 1 decimal
  };

  return (
    <HorizonContext.Provider
      value={{
        user,
        goals,
        people,
        importantDates,
        timeAwareness,
        isOnboarding,
        setIsOnboarding,
        updateGoalProgress,
        addGoal,
        addPerson,
        getCurrentRampedTarget,
      }}
    >
      {children}
    </HorizonContext.Provider>
  );
}

export function useHorizon() {
  const context = useContext(HorizonContext);
  if (context === undefined) {
    throw new Error('useHorizon must be used within a HorizonProvider');
  }
  return context;
}
