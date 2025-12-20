import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Scale, Heart, Dumbbell, Briefcase, Moon, AlertCircle } from 'lucide-react';
import { startOfWeek, endOfWeek, subWeeks } from 'date-fns';

interface BalanceArea {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  value: number; // 0-100 representing relative attention
  status: 'thriving' | 'balanced' | 'neglected';
  insight?: string;
}

export function BalanceScore() {
  const { user } = useAuth();
  const [areas, setAreas] = useState<BalanceArea[]>([]);
  const [overallInsight, setOverallInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      analyzeBalance();
    }
  }, [user]);

  const analyzeBalance = async () => {
    if (!user) return;
    setIsLoading(true);

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    try {
      // Fetch all relevant data for the week
      const [goalsResult, exerciseResult, downtimeResult, peopleResult, screenTimeResult] = await Promise.all([
        supabase
          .from('goal_logs')
          .select('goal_id, duration_minutes, goals(category)')
          .eq('user_id', user.id)
          .gte('logged_at', weekStart.toISOString())
          .lte('logged_at', weekEnd.toISOString()),
        supabase
          .from('exercise_logs')
          .select('duration_minutes')
          .eq('user_id', user.id)
          .gte('logged_at', weekStart.toISOString())
          .lte('logged_at', weekEnd.toISOString()),
        supabase
          .from('downtime_logs')
          .select('duration_minutes')
          .eq('user_id', user.id)
          .gte('logged_at', weekStart.toISOString())
          .lte('logged_at', weekEnd.toISOString()),
        supabase
          .from('people')
          .select('id, name, last_quality_time')
          .eq('user_id', user.id),
        supabase
          .from('screen_time_logs')
          .select('duration_minutes, intent_type')
          .eq('user_id', user.id)
          .gte('logged_at', weekStart.toISOString())
          .lte('logged_at', weekEnd.toISOString()),
      ]);

      // Calculate work activity (work category goals)
      const goalLogs = goalsResult.data || [];
      const workLogs = goalLogs.filter((log: any) => log.goals?.category === 'work');
      const workMinutes = workLogs.reduce((sum: number, log: any) => sum + (log.duration_minutes || 30), 0);

      // Calculate relationship activity
      const relationshipLogs = goalLogs.filter((log: any) => 
        ['relationship', 'kids'].includes(log.goals?.category)
      );
      const relationshipMinutes = relationshipLogs.reduce((sum: number, log: any) => sum + (log.duration_minutes || 30), 0);
      
      // Factor in recent quality time with people
      const people = peopleResult.data || [];
      const recentQualityTime = people.filter(p => {
        if (!p.last_quality_time) return false;
        const daysSince = Math.floor((Date.now() - new Date(p.last_quality_time).getTime()) / (1000 * 60 * 60 * 24));
        return daysSince <= 7;
      }).length;
      const relationshipBonus = recentQualityTime * 30; // 30 min equivalent per recent connection

      // Calculate health activity
      const exerciseLogs = exerciseResult.data || [];
      const exerciseMinutes = exerciseLogs.reduce((sum, log) => sum + log.duration_minutes, 0);
      const healthGoalLogs = goalLogs.filter((log: any) => log.goals?.category === 'health');
      const healthMinutes = exerciseMinutes + healthGoalLogs.reduce((sum: number, log: any) => sum + (log.duration_minutes || 30), 0);

      // Calculate rest
      const downtimeLogs = downtimeResult.data || [];
      const downtimeMinutes = downtimeLogs.reduce((sum, log) => sum + log.duration_minutes, 0);
      
      // Factor in intentional vs passive screen time
      const screenLogs = screenTimeResult.data || [];
      const intentionalScreen = screenLogs
        .filter(s => s.intent_type === 'intentional')
        .reduce((sum, s) => sum + s.duration_minutes, 0);
      const restMinutes = downtimeMinutes + (intentionalScreen * 0.5); // Intentional screen time counts partially

      // Normalize to relative percentages
      const total = workMinutes + (relationshipMinutes + relationshipBonus) + healthMinutes + restMinutes;
      
      const getStatus = (value: number, ideal: number): 'thriving' | 'balanced' | 'neglected' => {
        if (value >= ideal * 0.8) return 'thriving';
        if (value >= ideal * 0.4) return 'balanced';
        return 'neglected';
      };

      // Ideal distribution (subjective, but reasonable defaults)
      // Work: ~30%, Relationships: ~25%, Health: ~20%, Rest: ~25%
      const workValue = total > 0 ? Math.round((workMinutes / total) * 100) : 0;
      const relationshipValue = total > 0 ? Math.round(((relationshipMinutes + relationshipBonus) / total) * 100) : 0;
      const healthValue = total > 0 ? Math.round((healthMinutes / total) * 100) : 0;
      const restValue = total > 0 ? Math.round((restMinutes / total) * 100) : 0;

      const balanceAreas: BalanceArea[] = [
        {
          id: 'work',
          label: 'Work',
          icon: <Briefcase className="w-4 h-4" />,
          color: 'text-slate-400',
          bgColor: 'bg-slate-500/20',
          value: Math.min(workValue, 100),
          status: workValue > 50 ? 'thriving' : workValue > 20 ? 'balanced' : 'neglected',
          insight: workValue > 50 ? 'Work is dominating your week.' : undefined,
        },
        {
          id: 'relationships',
          label: 'Relationships',
          icon: <Heart className="w-4 h-4" />,
          color: 'text-rose-400',
          bgColor: 'bg-rose-500/20',
          value: Math.min(relationshipValue, 100),
          status: getStatus(relationshipValue, 25),
          insight: relationshipValue < 15 ? 'Relationships need more attention.' : undefined,
        },
        {
          id: 'health',
          label: 'Health',
          icon: <Dumbbell className="w-4 h-4" />,
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/20',
          value: Math.min(healthValue, 100),
          status: getStatus(healthValue, 20),
          insight: healthValue < 10 ? 'Your body is being neglected.' : undefined,
        },
        {
          id: 'rest',
          label: 'Rest',
          icon: <Moon className="w-4 h-4" />,
          color: 'text-indigo-400',
          bgColor: 'bg-indigo-500/20',
          value: Math.min(restValue, 100),
          status: getStatus(restValue, 25),
          insight: restValue < 15 ? 'Rest is being neglected this week.' : undefined,
        },
      ];

      setAreas(balanceAreas);

      // Generate overall insight
      const neglected = balanceAreas.filter(a => a.status === 'neglected');
      const thriving = balanceAreas.filter(a => a.status === 'thriving');
      
      if (total === 0) {
        setOverallInsight("No activity logged yet this week. Start tracking to see your balance.");
      } else if (neglected.length >= 2) {
        setOverallInsight(`${neglected.map(a => a.label).join(' and ')} need more attention this week.`);
      } else if (neglected.length === 1) {
        setOverallInsight(`${neglected[0].label} is being neglected. Consider making time for it.`);
      } else if (thriving.length === balanceAreas.length) {
        setOverallInsight("Beautiful balance this week. You're investing across all areas.");
      } else if (workValue > 50) {
        setOverallInsight("Work is taking up most of your energy. Is that intentional?");
      } else {
        setOverallInsight("Your week looks reasonably balanced. Keep noticing what feels right.");
      }

    } catch (error) {
      console.error('Error analyzing balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  const maxValue = Math.max(...areas.map(a => a.value), 1);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          Life Balance
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Where your time and energy are going this week
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Bars */}
        <div className="space-y-3">
          {areas.map((area) => (
            <div key={area.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={area.color}>{area.icon}</span>
                  <span className="text-sm font-medium text-foreground">{area.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {area.status === 'neglected' && (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span className="text-xs text-muted-foreground">{area.value}%</span>
                </div>
              </div>
              <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${area.bgColor}`}
                  style={{ width: `${(area.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Overall Insight */}
        {overallInsight && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-sm text-foreground/80 leading-relaxed">
              {overallInsight}
            </p>
          </div>
        )}

        {/* Neglected Areas */}
        {areas.filter(a => a.insight).length > 0 && (
          <div className="space-y-2">
            {areas.filter(a => a.insight).map(area => (
              <div 
                key={`insight-${area.id}`}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span className={area.color}>{area.icon}</span>
                <span>{area.insight}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pt-1">
          This is an observation, not a score. You define what balance means for you.
        </p>
      </CardContent>
    </Card>
  );
}
