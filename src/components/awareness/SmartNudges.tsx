import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, X, Moon, Heart, Dumbbell, Clock } from 'lucide-react';
import { subDays, format, differenceInDays, parseISO } from 'date-fns';

interface Nudge {
  id: string;
  icon: React.ReactNode;
  message: string;
  type: 'work' | 'rest' | 'relationship' | 'health';
  severity: 'gentle' | 'attention';
}

export function SmartNudges() {
  const { user } = useAuth();
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [dismissedNudges, setDismissedNudges] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      analyzePatterns();
    }
  }, [user]);

  const analyzePatterns = async () => {
    if (!user) return;
    setIsLoading(true);
    
    const detectedNudges: Nudge[] = [];
    const sevenDaysAgo = subDays(new Date(), 7);
    const fourteenDaysAgo = subDays(new Date(), 14);

    try {
      // Check for late work patterns (goal logs after 9pm)
      const { data: goalLogs } = await supabase
        .from('goal_logs')
        .select('logged_at')
        .eq('user_id', user.id)
        .gte('logged_at', sevenDaysAgo.toISOString());

      if (goalLogs) {
        const lateNights = goalLogs.filter(log => {
          const hour = new Date(log.logged_at).getHours();
          return hour >= 21; // 9pm or later
        });
        
        if (lateNights.length >= 4) {
          detectedNudges.push({
            id: 'late-work',
            icon: <Moon className="w-4 h-4" />,
            message: `You've been active past 9pm ${lateNights.length} times this week. Consider setting an earlier shutdown time.`,
            type: 'work',
            severity: 'attention',
          });
        }
      }

      // Check for low downtime
      const { data: downtimeLogs } = await supabase
        .from('downtime_logs')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .gte('logged_at', sevenDaysAgo.toISOString());

      if (downtimeLogs) {
        const totalDowntime = downtimeLogs.reduce((sum, log) => sum + log.duration_minutes, 0);
        const avgDailyDowntime = totalDowntime / 7;
        
        if (avgDailyDowntime < 30) {
          detectedNudges.push({
            id: 'low-downtime',
            icon: <Clock className="w-4 h-4" />,
            message: `You've averaged only ${Math.round(avgDailyDowntime)} minutes of downtime daily. Your mind needs rest too.`,
            type: 'rest',
            severity: 'attention',
          });
        }
      }

      // Check for relationship neglect
      const { data: people } = await supabase
        .from('people')
        .select('id, name, relationship, last_quality_time')
        .eq('user_id', user.id);

      if (people) {
        const neglectedPartner = people.find(p => {
          if (p.relationship !== 'partner') return false;
          if (!p.last_quality_time) return true;
          const daysSince = differenceInDays(new Date(), parseISO(p.last_quality_time));
          return daysSince >= 10;
        });

        if (neglectedPartner) {
          const days = neglectedPartner.last_quality_time 
            ? differenceInDays(new Date(), parseISO(neglectedPartner.last_quality_time))
            : 'many';
          detectedNudges.push({
            id: 'partner-time',
            icon: <Heart className="w-4 h-4" />,
            message: `No 1:1 time with ${neglectedPartner.name} in ${days} days. Small moments matter.`,
            type: 'relationship',
            severity: 'gentle',
          });
        }

        const neglectedFamily = people.filter(p => {
          if (!['child', 'parent', 'sibling'].includes(p.relationship)) return false;
          if (!p.last_quality_time) return true;
          const daysSince = differenceInDays(new Date(), parseISO(p.last_quality_time));
          return daysSince >= 14;
        });

        if (neglectedFamily.length > 0) {
          const names = neglectedFamily.slice(0, 2).map(p => p.name).join(', ');
          detectedNudges.push({
            id: 'family-time',
            icon: <Heart className="w-4 h-4" />,
            message: `It's been a while since quality time with ${names}${neglectedFamily.length > 2 ? ' and others' : ''}.`,
            type: 'relationship',
            severity: 'gentle',
          });
        }
      }

      // Check for exercise patterns
      const { data: exerciseLogs } = await supabase
        .from('exercise_logs')
        .select('logged_at')
        .eq('user_id', user.id)
        .gte('logged_at', sevenDaysAgo.toISOString());

      if (exerciseLogs && exerciseLogs.length < 2) {
        detectedNudges.push({
          id: 'low-exercise',
          icon: <Dumbbell className="w-4 h-4" />,
          message: `Only ${exerciseLogs.length} exercise session${exerciseLogs.length === 1 ? '' : 's'} this week. Even a short walk counts.`,
          type: 'health',
          severity: 'gentle',
        });
      }

      // Check for passive screen time pattern
      const { data: screenTimeLogs } = await supabase
        .from('screen_time_logs')
        .select('duration_minutes, intent_type')
        .eq('user_id', user.id)
        .gte('logged_at', sevenDaysAgo.toISOString());

      if (screenTimeLogs) {
        const passiveTime = screenTimeLogs
          .filter(log => log.intent_type === 'passive')
          .reduce((sum, log) => sum + log.duration_minutes, 0);
        const totalTime = screenTimeLogs.reduce((sum, log) => sum + log.duration_minutes, 0);
        
        if (totalTime > 0 && passiveTime / totalTime > 0.5) {
          detectedNudges.push({
            id: 'passive-screen',
            icon: <AlertCircle className="w-4 h-4" />,
            message: `Over half your screen time this week was passive scrolling. Notice when drift happens.`,
            type: 'rest',
            severity: 'gentle',
          });
        }
      }

      setNudges(detectedNudges);
    } catch (error) {
      console.error('Error analyzing patterns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissNudge = (id: string) => {
    setDismissedNudges(prev => [...prev, id]);
  };

  const visibleNudges = nudges.filter(n => !dismissedNudges.includes(n.id));

  if (isLoading || visibleNudges.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          Patterns Noticed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleNudges.map((nudge) => (
          <div 
            key={nudge.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
              nudge.severity === 'attention' 
                ? 'bg-amber-500/10 border border-amber-500/20' 
                : 'bg-muted/50'
            }`}
          >
            <div className={`mt-0.5 ${
              nudge.severity === 'attention' ? 'text-amber-500' : 'text-muted-foreground'
            }`}>
              {nudge.icon}
            </div>
            <p className="text-sm text-foreground flex-1 leading-relaxed">
              {nudge.message}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => dismissNudge(nudge.id)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
        <p className="text-xs text-muted-foreground text-center pt-1">
          These patterns are based on your activity over the past week
        </p>
      </CardContent>
    </Card>
  );
}
