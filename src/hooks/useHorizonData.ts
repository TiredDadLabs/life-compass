import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DbGoal {
  id: string;
  user_id: string;
  name: string;
  category: string;
  target_per_week: number;
  current_progress: number;
  unit: string;
  ramp_enabled: boolean;
  ramp_start: number | null;
  ramp_duration_weeks: number | null;
  ramp_current_week: number | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPerson {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  interests: string[] | null;
  notes: string | null;
  location: string | null;
  avatar_url: string | null;
  last_quality_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbImportantDate {
  id: string;
  user_id: string;
  person_id: string | null;
  title: string;
  date: string;
  type: string;
  is_recurring: boolean;
  reminder_days_before: number | null;
  created_at: string;
  person_name?: string;
}

export interface DbProfile {
  id: string;
  name: string | null;
  email: string | null;
  city: string | null;
  timezone: string | null;
  work_start_hour: number | null;
  work_end_hour: number | null;
  priority_areas: string[] | null;
  onboarding_completed: boolean | null;
  created_at: string;
  updated_at: string;
}

export function useHorizonData() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [goals, setGoals] = useState<DbGoal[]>([]);
  const [people, setPeople] = useState<DbPerson[]>([]);
  const [importantDates, setImportantDates] = useState<DbImportantDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      // Prefer the authenticated email as the source of truth.
      // (This prevents stale/incorrect profile email from showing in the UI.)
      const merged = data ? { ...data, email: user.email ?? data.email } : null;
      setProfile(merged);

      if (data && user.email && data.email !== user.email) {
        // Best-effort sync; don't block UI on this.
        void supabase.from('profiles').update({ email: user.email }).eq('id', user.id);
      }
    }
  }, [user]);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching goals:', error);
    } else {
      setGoals(data || []);
    }
  }, [user]);

  const fetchPeople = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching people:', error);
    } else {
      setPeople(data || []);
    }
  }, [user]);

  const fetchImportantDates = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('important_dates')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching important dates:', error);
    } else {
      // Enrich with person names
      const enriched = (data || []).map(d => {
        const person = people.find(p => p.id === d.person_id);
        return { ...d, person_name: person?.name };
      });
      setImportantDates(enriched);
    }
  }, [user, people]);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    await Promise.all([
      fetchProfile(),
      fetchGoals(),
      fetchPeople(),
    ]);
    setIsLoading(false);
  }, [user, fetchProfile, fetchGoals, fetchPeople]);

  // Fetch important dates after people are loaded
  useEffect(() => {
    if (people.length >= 0 && user) {
      fetchImportantDates();
    }
  }, [people, user, fetchImportantDates]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updateProfile = async (updates: Partial<DbProfile>) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    
    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
    
    await fetchProfile();
  };

  const addGoal = async (goal: Omit<DbGoal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'current_progress'>) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('goals')
      .insert({ ...goal, user_id: user.id, current_progress: 0 });
    
    if (error) {
      console.error('Error adding goal:', error);
      throw error;
    }
    
    await fetchGoals();
  };

  const updateGoalProgress = async (goalId: string, progress: number) => {
    const { error } = await supabase
      .from('goals')
      .update({ current_progress: progress })
      .eq('id', goalId);
    
    if (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
    
    await fetchGoals();
  };

  const addPerson = async (
    person: Omit<DbPerson, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    dates?: { title: string; date: string; type: string }[]
  ) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('people')
      .insert({ ...person, user_id: user.id })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding person:', error);
      throw error;
    }
    
    // Add important dates if provided
    if (dates && dates.length > 0 && data) {
      const datesToInsert = dates.map(d => ({
        user_id: user.id,
        person_id: data.id,
        title: d.title,
        date: d.date,
        type: d.type,
        is_recurring: true,
      }));
      
      const { error: datesError } = await supabase
        .from('important_dates')
        .insert(datesToInsert);
      
      if (datesError) {
        console.error('Error adding dates:', datesError);
      }
    }
    
    await fetchPeople();
    await fetchImportantDates();
  };

  const updatePerson = async (
    personId: string,
    updates: Partial<Omit<DbPerson, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
    dates?: { title: string; date: string; type: string }[]
  ) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('people')
      .update(updates)
      .eq('id', personId);
    
    if (error) {
      console.error('Error updating person:', error);
      throw error;
    }
    
    // Update important dates if provided
    if (dates !== undefined) {
      // Delete existing dates for this person
      await supabase
        .from('important_dates')
        .delete()
        .eq('person_id', personId);
      
      // Insert new dates
      if (dates.length > 0) {
        const datesToInsert = dates.map(d => ({
          user_id: user.id,
          person_id: personId,
          title: d.title,
          date: d.date,
          type: d.type,
          is_recurring: true,
        }));
        
        const { error: datesError } = await supabase
          .from('important_dates')
          .insert(datesToInsert);
        
        if (datesError) {
          console.error('Error updating dates:', datesError);
        }
      }
    }
    
    await fetchPeople();
    await fetchImportantDates();
  };

  const getPersonDates = (personId: string) => {
    return importantDates.filter(d => d.person_id === personId);
  };

  const deletePerson = async (personId: string) => {
    const { error } = await supabase
      .from('people')
      .delete()
      .eq('id', personId);
    
    if (error) {
      console.error('Error deleting person:', error);
      throw error;
    }
    
    await fetchPeople();
  };

  const logGoalActivity = async (goalId: string, durationMinutes?: number, notes?: string, peopleInvolved?: string[]) => {
    if (!user) return;
    
    const { error: logError } = await supabase
      .from('goal_logs')
      .insert({
        user_id: user.id,
        goal_id: goalId,
        duration_minutes: durationMinutes || null,
        notes: notes || null,
        people_involved: peopleInvolved || null,
      });
    
    if (logError) {
      console.error('Error logging activity:', logError);
      throw logError;
    }

    // Also increment current_progress
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      await updateGoalProgress(goalId, goal.current_progress + 1);
    }
  };

  const getCurrentRampedTarget = (goal: DbGoal): number => {
    if (!goal.ramp_enabled || !goal.ramp_start || !goal.ramp_duration_weeks || !goal.ramp_current_week) {
      return goal.target_per_week;
    }
    
    const increment = (goal.target_per_week - goal.ramp_start) / goal.ramp_duration_weeks;
    const currentTarget = goal.ramp_start + (increment * goal.ramp_current_week);
    
    // Use whole numbers for session-based goals (you can't have 1.3 dates)
    if (goal.unit === 'sessions') {
      return Math.round(currentTarget);
    }
    // Allow decimals for hour-based goals
    return Math.round(currentTarget * 10) / 10;
  };

  return {
    profile,
    goals,
    people,
    importantDates,
    isLoading,
    fetchAll,
    fetchProfile,
    fetchGoals,
    fetchPeople,
    fetchImportantDates,
    updateProfile,
    addGoal,
    updateGoalProgress,
    addPerson,
    updatePerson,
    deletePerson,
    getPersonDates,
    logGoalActivity,
    getCurrentRampedTarget,
  };
}
