-- Screen time logs table for tracking intentional vs passive screen time
CREATE TABLE public.screen_time_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  intent_type TEXT NOT NULL DEFAULT 'intentional', -- 'intentional' or 'passive'
  category TEXT, -- 'work', 'communication', 'entertainment', 'scrolling', 'other'
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.screen_time_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own screen time logs" ON public.screen_time_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own screen time logs" ON public.screen_time_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own screen time logs" ON public.screen_time_logs FOR DELETE USING (auth.uid() = user_id);

-- Shutdown mode sessions table
CREATE TABLE public.shutdown_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  suggested_activity TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shutdown_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own shutdown sessions" ON public.shutdown_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shutdown sessions" ON public.shutdown_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shutdown sessions" ON public.shutdown_sessions FOR UPDATE USING (auth.uid() = user_id);

-- User preferences for screen time awareness
CREATE TABLE public.screen_time_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  daily_passive_limit_minutes INTEGER DEFAULT 60,
  shutdown_reminder_enabled BOOLEAN DEFAULT true,
  shutdown_reminder_time TEXT DEFAULT '21:00',
  nudges_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.screen_time_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own screen time preferences" ON public.screen_time_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own screen time preferences" ON public.screen_time_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own screen time preferences" ON public.screen_time_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_screen_time_preferences_updated_at
  BEFORE UPDATE ON public.screen_time_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();