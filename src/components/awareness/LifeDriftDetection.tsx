import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp, TrendingDown, Minus, Activity, Clock, Heart, Dumbbell, Smartphone } from 'lucide-react';
import { subWeeks, startOfWeek, endOfWeek, differenceInMinutes } from 'date-fns';

interface DriftMetric {
  id: string;
  label: string;
  icon: React.ReactNode;
  currentValue: number;
  previousValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  isPositive: boolean; // Whether the trend direction is good
  message?: string;
}

export function LifeDriftDetection() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DriftMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      detectDrift();
    }
  }, [user]);

  const detectDrift = async () => {
    if (!user) return;
    setIsLoading(true);

    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = subWeeks(thisWeekStart, 1);
    const lastWeekEnd = subWeeks(thisWeekEnd, 1);
    const threeWeeksAgoStart = subWeeks(thisWeekStart, 3);

    const driftMetrics: DriftMetric[] = [];

    try {
      // Work hours drift (using goal logs as proxy)
      const { data: currentGoalLogs } = await supabase
        .from('goal_logs')
        .select('logged_at, duration_minutes')
        .eq('user_id', user.id)
        .gte('logged_at', thisWeekStart.toISOString())
        .lte('logged_at', thisWeekEnd.toISOString());

      const { data: previousGoalLogs } = await supabase
        .from('goal_logs')
        .select('logged_at, duration_minutes')
        .eq('user_id', user.id)
        .gte('logged_at', threeWeeksAgoStart.toISOString())
        .lt('logged_at', thisWeekStart.toISOString());

      if (currentGoalLogs && previousGoalLogs && previousGoalLogs.length > 0) {
        // Calculate average latest activity hour for current vs previous weeks
        const getAvgLatestHour = (logs: any[]) => {
          if (logs.length === 0) return null;
          const hours = logs.map(l => new Date(l.logged_at).getHours());
          return hours.reduce((a, b) => a + b, 0) / hours.length;
        };

        const currentAvgHour = getAvgLatestHour(currentGoalLogs);
        const previousAvgHour = getAvgLatestHour(previousGoalLogs);

        if (currentAvgHour !== null && previousAvgHour !== null) {
          const hourDiff = currentAvgHour - previousAvgHour;
          const diffMinutes = Math.round(hourDiff * 60);
          
          if (Math.abs(diffMinutes) >= 30) {
            driftMetrics.push({
              id: 'work-hours',
              label: 'Activity Time',
              icon: <Clock className="w-4 h-4" />,
              currentValue: Math.round(currentAvgHour * 10) / 10,
              previousValue: Math.round(previousAvgHour * 10) / 10,
              unit: 'avg hour',
              trend: diffMinutes > 0 ? 'up' : 'down',
              isPositive: diffMinutes < 0, // Earlier is better
              message: diffMinutes > 0 
                ? `Your average activity time has shifted ${Math.abs(diffMinutes)} minutes later over 3 weeks.`
                : `You're wrapping up ${Math.abs(diffMinutes)} minutes earlier on average.`,
            });
          }
        }
      }

      // Exercise frequency drift
      const { data: currentExercise } = await supabase
        .from('exercise_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('logged_at', thisWeekStart.toISOString())
        .lte('logged_at', thisWeekEnd.toISOString());

      const { data: previousExercise } = await supabase
        .from('exercise_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('logged_at', lastWeekStart.toISOString())
        .lte('logged_at', lastWeekEnd.toISOString());

      if (currentExercise !== null && previousExercise !== null) {
        const currentCount = currentExercise.length;
        const previousCount = previousExercise.length;
        const diff = currentCount - previousCount;

        if (Math.abs(diff) >= 1) {
          driftMetrics.push({
            id: 'exercise',
            label: 'Exercise',
            icon: <Dumbbell className="w-4 h-4" />,
            currentValue: currentCount,
            previousValue: previousCount,
            unit: 'sessions',
            trend: diff > 0 ? 'up' : 'down',
            isPositive: diff > 0,
            message: diff > 0 
              ? `${diff} more exercise session${diff > 1 ? 's' : ''} than last week!`
              : `${Math.abs(diff)} fewer session${Math.abs(diff) > 1 ? 's' : ''} than last week.`,
          });
        }
      }

      // Downtime drift
      const { data: currentDowntime } = await supabase
        .from('downtime_logs')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .gte('logged_at', thisWeekStart.toISOString())
        .lte('logged_at', thisWeekEnd.toISOString());

      const { data: previousDowntime } = await supabase
        .from('downtime_logs')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .gte('logged_at', lastWeekStart.toISOString())
        .lte('logged_at', lastWeekEnd.toISOString());

      if (currentDowntime !== null && previousDowntime !== null) {
        const currentTotal = currentDowntime.reduce((sum, d) => sum + d.duration_minutes, 0);
        const previousTotal = previousDowntime.reduce((sum, d) => sum + d.duration_minutes, 0);
        const diff = currentTotal - previousTotal;

        if (Math.abs(diff) >= 30) {
          driftMetrics.push({
            id: 'downtime',
            label: 'Downtime',
            icon: <Activity className="w-4 h-4" />,
            currentValue: Math.round(currentTotal / 60 * 10) / 10,
            previousValue: Math.round(previousTotal / 60 * 10) / 10,
            unit: 'hours',
            trend: diff > 0 ? 'up' : 'down',
            isPositive: diff > 0,
            message: diff > 0 
              ? `${Math.round(diff / 60 * 10) / 10} more hours of rest this week.`
              : `${Math.round(Math.abs(diff) / 60 * 10) / 10} hours less downtime than last week.`,
          });
        }
      }

      // Screen time drift (passive vs intentional)
      const { data: currentScreenTime } = await supabase
        .from('screen_time_logs')
        .select('duration_minutes, intent_type')
        .eq('user_id', user.id)
        .gte('logged_at', thisWeekStart.toISOString())
        .lte('logged_at', thisWeekEnd.toISOString());

      const { data: previousScreenTime } = await supabase
        .from('screen_time_logs')
        .select('duration_minutes, intent_type')
        .eq('user_id', user.id)
        .gte('logged_at', lastWeekStart.toISOString())
        .lte('logged_at', lastWeekEnd.toISOString());

      if (currentScreenTime !== null && previousScreenTime !== null) {
        const currentPassive = currentScreenTime
          .filter(s => s.intent_type === 'passive')
          .reduce((sum, s) => sum + s.duration_minutes, 0);
        const previousPassive = previousScreenTime
          .filter(s => s.intent_type === 'passive')
          .reduce((sum, s) => sum + s.duration_minutes, 0);
        const diff = currentPassive - previousPassive;

        if (Math.abs(diff) >= 30) {
          driftMetrics.push({
            id: 'passive-screen',
            label: 'Passive Scrolling',
            icon: <Smartphone className="w-4 h-4" />,
            currentValue: Math.round(currentPassive / 60 * 10) / 10,
            previousValue: Math.round(previousPassive / 60 * 10) / 10,
            unit: 'hours',
            trend: diff > 0 ? 'up' : 'down',
            isPositive: diff < 0, // Less passive is better
            message: diff > 0 
              ? `Passive screen time up ${Math.round(diff / 60 * 10) / 10} hours from last week.`
              : `${Math.round(Math.abs(diff) / 60 * 10) / 10} hours less mindless scrolling!`,
          });
        }
      }

      setMetrics(driftMetrics);
    } catch (error) {
      console.error('Error detecting drift:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (metric: DriftMetric) => {
    if (metric.trend === 'up') {
      return <TrendingUp className={`w-4 h-4 ${metric.isPositive ? 'text-emerald-500' : 'text-amber-500'}`} />;
    } else if (metric.trend === 'down') {
      return <TrendingDown className={`w-4 h-4 ${metric.isPositive ? 'text-emerald-500' : 'text-amber-500'}`} />;
    }
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  if (isLoading) {
    return null;
  }

  if (metrics.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Life Drift
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Gradual changes in your habits over time
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {metrics.map((metric) => (
          <div 
            key={metric.id}
            className={`p-3 rounded-lg ${
              metric.isPositive ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{metric.icon}</span>
                <span className="text-sm font-medium">{metric.label}</span>
              </div>
              {getTrendIcon(metric)}
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {metric.message}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>Last week: {metric.previousValue} {metric.unit}</span>
              <span>→</span>
              <span>This week: {metric.currentValue} {metric.unit}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
