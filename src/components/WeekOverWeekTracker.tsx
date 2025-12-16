import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks, isWithinInterval, parseISO } from 'date-fns';

interface GoalLog {
  id: string;
  goal_id: string;
  logged_at: string;
  duration_minutes: number | null;
}

interface WeekData {
  weekStart: Date;
  weekEnd: Date;
  logs: GoalLog[];
  totalSessions: number;
}

interface WeekOverWeekTrackerProps {
  goals: Array<{
    id: string;
    name: string;
    category: string;
    target_per_week: number;
    unit: string;
  }>;
}

export function WeekOverWeekTracker({ goals }: WeekOverWeekTrackerProps) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<GoalLog[]>([]);
  const [weeksToShow, setWeeksToShow] = useState(4);
  const [startWeekOffset, setStartWeekOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user) return;
      
      setIsLoading(true);
      const weeksBack = startWeekOffset + weeksToShow + 1;
      const fromDate = startOfWeek(subWeeks(new Date(), weeksBack), { weekStartsOn: 1 });
      
      const { data, error } = await supabase
        .from('goal_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', fromDate.toISOString())
        .order('logged_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching logs:', error);
      } else {
        setLogs(data || []);
      }
      setIsLoading(false);
    };

    fetchLogs();
  }, [user, weeksToShow, startWeekOffset]);

  const getWeeksData = (): WeekData[] => {
    const weeks: WeekData[] = [];
    const now = new Date();
    
    for (let i = startWeekOffset; i < startWeekOffset + weeksToShow; i++) {
      const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      
      const weekLogs = logs.filter(log => {
        const logDate = parseISO(log.logged_at);
        return isWithinInterval(logDate, { start: weekStart, end: weekEnd });
      });
      
      weeks.push({
        weekStart,
        weekEnd,
        logs: weekLogs,
        totalSessions: weekLogs.length,
      });
    }
    
    return weeks.reverse();
  };

  const weeksData = getWeeksData();
  
  const getGoalWeeklyData = (goalId: string) => {
    return weeksData.map(week => ({
      ...week,
      count: week.logs.filter(l => l.goal_id === goalId).length,
    }));
  };

  const getTrend = (data: { count: number }[]) => {
    if (data.length < 2) return 'stable';
    const recent = data.slice(-2);
    const diff = recent[1].count - recent[0].count;
    if (diff > 0) return 'up';
    if (diff < 0) return 'down';
    return 'stable';
  };

  const getTotalTarget = () => goals.reduce((sum, g) => sum + g.target_per_week, 0);
  
  const getWeeklyCompletion = (weekIndex: number) => {
    const week = weeksData[weekIndex];
    if (!week) return 0;
    const total = getTotalTarget();
    if (total === 0) return 0;
    return Math.round((week.totalSessions / total) * 100);
  };

  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary rounded w-1/3" />
          <div className="h-24 bg-secondary rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Week Over Week Progress
          </h3>
          <p className="text-sm text-muted-foreground">
            Track your consistency over time
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStartWeekOffset(prev => prev + 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStartWeekOffset(prev => Math.max(0, prev - 1))}
            disabled={startWeekOffset === 0}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Weekly overview chart */}
      <div className="mb-6">
        <div className="flex items-end justify-between gap-2 h-32 mb-2">
          {weeksData.map((week, idx) => {
            const completion = getWeeklyCompletion(idx);
            const isCurrentWeek = idx === weeksData.length - 1 && startWeekOffset === 0;
            
            return (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div
                  className={cn(
                    "w-full rounded-t-lg transition-all",
                    isCurrentWeek ? "gradient-horizon" : "bg-secondary",
                    completion >= 100 && "bg-success"
                  )}
                  style={{ height: `${Math.max(completion, 5)}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          {weeksData.map((week, idx) => (
            <div key={idx} className="flex-1 text-center">
              {format(week.weekStart, 'MMM d')}
            </div>
          ))}
        </div>
      </div>

      {/* Per-goal breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">By Goal</h4>
        {goals.map(goal => {
          const weeklyData = getGoalWeeklyData(goal.id);
          const trend = getTrend(weeklyData);
          const currentWeek = weeklyData[weeklyData.length - 1];
          const prevWeek = weeklyData[weeklyData.length - 2];
          
          return (
            <div key={goal.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{goal.name}</p>
                <div className="flex items-center gap-4 mt-1">
                  {weeklyData.map((week, idx) => (
                    <div key={idx} className="text-center">
                      <span className={cn(
                        "text-xs font-medium",
                        week.count >= goal.target_per_week ? "text-success" : "text-muted-foreground"
                      )}>
                        {week.count}/{goal.target_per_week}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={cn(
                "flex items-center gap-1 text-sm",
                trend === 'up' && "text-success",
                trend === 'down' && "text-destructive",
                trend === 'stable' && "text-muted-foreground"
              )}>
                {trend === 'up' && <TrendingUp className="w-4 h-4" />}
                {trend === 'down' && <TrendingDown className="w-4 h-4" />}
                {trend === 'stable' && <Minus className="w-4 h-4" />}
                {prevWeek && currentWeek && (
                  <span className="text-xs">
                    {currentWeek.count - prevWeek.count >= 0 ? '+' : ''}
                    {currentWeek.count - prevWeek.count}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {logs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No activity logged yet.</p>
          <p className="text-xs mt-1">Start logging progress on your goals to see trends!</p>
        </div>
      )}
    </Card>
  );
}
