import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dumbbell, Apple, Moon, Heart, Sparkles, AlertCircle, Check, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfWeek, endOfWeek, isWithinInterval, subDays } from 'date-fns';

interface WeeklySummaryData {
  exercise: {
    sessions: number;
    goal: number;
    totalMinutes: number;
  };
  nutrition: {
    checkins: number;
    consistentDays: number;
  };
  downtime: {
    totalMinutes: number;
    sessions: number;
    daysWithRest: number;
    daysWithAloneTime: number;
  };
  mood: {
    avgMood: number;
    avgEnergy: number;
    highStressDays: number;
  };
  rituals: {
    completed: number;
    total: number;
  };
}

export function WeeklySummary() {
  const { user } = useAuth();
  const [data, setData] = useState<WeeklySummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    if (!user) return;

    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

      const [
        exerciseLogsRes,
        exerciseGoalRes,
        nutritionRes,
        downtimeRes,
        moodRes,
        ritualsRes,
        completionsRes
      ] = await Promise.all([
        supabase
          .from('exercise_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('logged_at', weekStart.toISOString())
          .lte('logged_at', weekEnd.toISOString()),
        supabase
          .from('exercise_goals')
          .select('sessions_per_week')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('nutrition_checkins')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', weekStartStr)
          .lte('date', weekEndStr),
        supabase
          .from('downtime_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('logged_at', weekStart.toISOString())
          .lte('logged_at', weekEnd.toISOString()),
        supabase
          .from('mood_checkins')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', weekStartStr)
          .lte('date', weekEndStr),
        supabase
          .from('personal_rituals')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true),
        supabase
          .from('ritual_completions')
          .select('*')
          .eq('user_id', user.id)
          .gte('completed_date', weekStartStr)
          .lte('completed_date', weekEndStr)
      ]);

      const exerciseLogs = exerciseLogsRes.data || [];
      const nutritionCheckins = nutritionRes.data || [];
      const downtimeLogs = downtimeRes.data || [];
      const moodCheckins = moodRes.data || [];
      const rituals = ritualsRes.data || [];
      const completions = completionsRes.data || [];

      // Calculate downtime days
      const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd'));
      const daysWithRest = new Set(
        downtimeLogs.map(log => format(new Date(log.logged_at), 'yyyy-MM-dd'))
      ).size;
      const daysWithAloneTime = new Set(
        downtimeLogs
          .filter(log => log.downtime_type === 'alone_time')
          .map(log => format(new Date(log.logged_at), 'yyyy-MM-dd'))
      ).size;

      // Calculate nutrition consistency
      const consistentDays = nutritionCheckins.filter(c => 
        c.ate_regular_meals && c.drank_enough_water
      ).length;

      // Calculate mood averages
      const moodScores = moodCheckins.filter(c => c.mood_score).map(c => c.mood_score!);
      const energyScores = moodCheckins.filter(c => c.energy_level).map(c => c.energy_level!);
      const avgMood = moodScores.length 
        ? Math.round(moodScores.reduce((a, b) => a + b, 0) / moodScores.length * 10) / 10
        : 0;
      const avgEnergy = energyScores.length 
        ? Math.round(energyScores.reduce((a, b) => a + b, 0) / energyScores.length * 10) / 10
        : 0;
      const highStressDays = moodCheckins.filter(c => c.stress_level === 'high').length;

      // Calculate rituals
      const uniqueRitualCompletions = new Set(completions.map(c => `${c.ritual_id}-${c.completed_date}`)).size;

      setData({
        exercise: {
          sessions: exerciseLogs.length,
          goal: exerciseGoalRes.data?.sessions_per_week || 3,
          totalMinutes: exerciseLogs.reduce((sum, l) => sum + l.duration_minutes, 0)
        },
        nutrition: {
          checkins: nutritionCheckins.length,
          consistentDays
        },
        downtime: {
          totalMinutes: downtimeLogs.reduce((sum, l) => sum + l.duration_minutes, 0),
          sessions: downtimeLogs.length,
          daysWithRest,
          daysWithAloneTime
        },
        mood: {
          avgMood,
          avgEnergy,
          highStressDays
        },
        rituals: {
          completed: uniqueRitualCompletions,
          total: rituals.length * 7 // potential completions this week
        }
      });
    } catch (error) {
      console.error('Error fetching summary data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate insights
  const getInsights = () => {
    if (!data) return [];
    
    const insights: { type: 'warning' | 'gentle' | 'positive', text: string }[] = [];

    // Downtime awareness (critical)
    if (data.downtime.daysWithRest <= 2) {
      insights.push({
        type: 'warning',
        text: "You've had very little rest this week. Your downtime matters — protect it."
      });
    } else if (data.downtime.daysWithAloneTime <= 1) {
      insights.push({
        type: 'gentle',
        text: "Not much alone time this week. Even small pockets of solitude can help."
      });
    }

    // High stress + low rest
    if (data.mood.highStressDays >= 3 && data.downtime.totalMinutes < 120) {
      insights.push({
        type: 'warning',
        text: "High stress and low rest detected. This is a signal to slow down if you can."
      });
    }

    // Exercise consistency
    if (data.exercise.sessions >= data.exercise.goal) {
      insights.push({
        type: 'positive',
        text: `You hit your movement goal of ${data.exercise.goal} sessions. Consistency builds.`
      });
    } else if (data.exercise.sessions === 0) {
      insights.push({
        type: 'gentle',
        text: "No movement logged yet. Even a short walk counts — ready when you are."
      });
    }

    // Good balance
    if (
      data.downtime.daysWithRest >= 5 &&
      data.mood.avgMood >= 3.5 &&
      data.mood.highStressDays <= 1
    ) {
      insights.push({
        type: 'positive',
        text: "This was a balanced week. Notice what worked and protect it."
      });
    }

    // Nutrition patterns
    if (data.nutrition.consistentDays >= 5) {
      insights.push({
        type: 'positive',
        text: "Consistent nourishment this week. That's caring for yourself well."
      });
    } else if (data.nutrition.checkins >= 3 && data.nutrition.consistentDays <= 1) {
      insights.push({
        type: 'gentle',
        text: "Meals and hydration have been inconsistent. Low energy often follows."
      });
    }

    return insights.slice(0, 3); // Max 3 insights
  };

  const insights = getInsights();
  const moodEmojis = ['😔', '😕', '😐', '🙂', '😊'];

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading your week...
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-8 text-center text-muted-foreground">
          Start tracking to see your weekly summary
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <Card 
              key={i}
              className={`shadow-soft ${
                insight.type === 'warning' 
                  ? 'bg-gentle-alert/50 border-gentle-alert' 
                  : insight.type === 'positive'
                    ? 'bg-success/10 border-success/30'
                    : 'bg-secondary/50 border-border'
              }`}
            >
              <CardContent className="py-4 flex items-start gap-3">
                {insight.type === 'warning' ? (
                  <AlertCircle className="w-5 h-5 text-gentle-alert-foreground shrink-0 mt-0.5" />
                ) : insight.type === 'positive' ? (
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <p className={`text-sm leading-relaxed ${
                  insight.type === 'warning' 
                    ? 'text-gentle-alert-foreground' 
                    : insight.type === 'positive'
                      ? 'text-success'
                      : 'text-muted-foreground'
                }`}>
                  {insight.text}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Exercise */}
        <Card className="shadow-soft">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Exercise</span>
            </div>
            <p className="text-xl font-display font-bold text-foreground">
              {data.exercise.sessions} / {data.exercise.goal}
            </p>
            <p className="text-xs text-muted-foreground">sessions this week</p>
            <Progress 
              value={(data.exercise.sessions / data.exercise.goal) * 100} 
              className="h-1.5 mt-2"
            />
          </CardContent>
        </Card>

        {/* Downtime */}
        <Card className={`shadow-soft ${
          data.downtime.daysWithRest <= 2 ? 'border-gentle-alert' : ''
        }`}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <Moon className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Downtime</span>
            </div>
            <p className="text-xl font-display font-bold text-foreground">
              {Math.round(data.downtime.totalMinutes / 60 * 10) / 10}h
            </p>
            <p className="text-xs text-muted-foreground">
              {data.downtime.daysWithRest} days with rest
            </p>
            <div className="flex gap-1 mt-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div 
                  key={i}
                  className={`flex-1 h-1.5 rounded-full ${
                    i < data.downtime.daysWithRest ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Nutrition */}
        <Card className="shadow-soft">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <Apple className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">Nutrition</span>
            </div>
            <p className="text-xl font-display font-bold text-foreground">
              {data.nutrition.consistentDays} / 7
            </p>
            <p className="text-xs text-muted-foreground">consistent days</p>
            <Progress 
              value={(data.nutrition.consistentDays / 7) * 100} 
              className="h-1.5 mt-2"
            />
          </CardContent>
        </Card>

        {/* Mood & Energy */}
        <Card className={`shadow-soft ${
          data.mood.highStressDays >= 3 ? 'border-gentle-alert' : ''
        }`}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Well-being</span>
            </div>
            <div className="flex items-center gap-3">
              {data.mood.avgMood > 0 && (
                <span className="text-2xl">
                  {moodEmojis[Math.round(data.mood.avgMood) - 1]}
                </span>
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {data.mood.avgMood > 0 ? `Avg ${data.mood.avgMood}` : 'No data'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.mood.highStressDays} high stress {data.mood.highStressDays === 1 ? 'day' : 'days'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rituals */}
      {data.rituals.total > 0 && (
        <Card className="shadow-soft">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-highlight" />
                <span className="text-sm text-muted-foreground">Personal Rituals</span>
              </div>
              <p className="text-sm font-medium text-foreground">
                {data.rituals.completed} completed this week
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week Range */}
      <p className="text-center text-xs text-muted-foreground">
        Week of {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d')}
      </p>
    </div>
  );
}
