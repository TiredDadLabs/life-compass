-- Exercise logs table
CREATE TABLE public.exercise_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('strength', 'cardio', 'walk', 'mobility', 'other')),
  duration_minutes INTEGER NOT NULL,
  note TEXT,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Weekly exercise goals
CREATE TABLE public.exercise_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  sessions_per_week INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Nutrition check-ins
CREATE TABLE public.nutrition_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  ate_regular_meals BOOLEAN DEFAULT false,
  drank_enough_water BOOLEAN DEFAULT false,
  ate_whole_foods BOOLEAN DEFAULT false,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Downtime logs
CREATE TABLE public.downtime_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  downtime_type TEXT NOT NULL CHECK (downtime_type IN ('alone_time', 'rest', 'leisure', 'phone_free')),
  duration_minutes INTEGER NOT NULL,
  note TEXT,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mood check-ins
CREATE TABLE public.mood_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
  stress_level TEXT CHECK (stress_level IN ('low', 'medium', 'high')),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  drained_by TEXT,
  energized_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Personal rituals
CREATE TABLE public.personal_rituals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'anytime')),
  reminder_enabled BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ritual completions
CREATE TABLE public.ritual_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ritual_id UUID NOT NULL REFERENCES public.personal_rituals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ritual_id, completed_date)
);

-- Enable RLS on all tables
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downtime_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_rituals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ritual_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exercise_logs
CREATE POLICY "Users can view own exercise logs" ON public.exercise_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exercise logs" ON public.exercise_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own exercise logs" ON public.exercise_logs FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for exercise_goals
CREATE POLICY "Users can view own exercise goals" ON public.exercise_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exercise goals" ON public.exercise_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exercise goals" ON public.exercise_goals FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for nutrition_checkins
CREATE POLICY "Users can view own nutrition checkins" ON public.nutrition_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own nutrition checkins" ON public.nutrition_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own nutrition checkins" ON public.nutrition_checkins FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for downtime_logs
CREATE POLICY "Users can view own downtime logs" ON public.downtime_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own downtime logs" ON public.downtime_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own downtime logs" ON public.downtime_logs FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for mood_checkins
CREATE POLICY "Users can view own mood checkins" ON public.mood_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mood checkins" ON public.mood_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mood checkins" ON public.mood_checkins FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for personal_rituals
CREATE POLICY "Users can view own rituals" ON public.personal_rituals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rituals" ON public.personal_rituals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rituals" ON public.personal_rituals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rituals" ON public.personal_rituals FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ritual_completions
CREATE POLICY "Users can view own ritual completions" ON public.ritual_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ritual completions" ON public.ritual_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own ritual completions" ON public.ritual_completions FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_exercise_goals_updated_at BEFORE UPDATE ON public.exercise_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_personal_rituals_updated_at BEFORE UPDATE ON public.personal_rituals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();