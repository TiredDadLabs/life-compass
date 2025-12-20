import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, X, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

const restMessages = [
  { message: "You've earned rest today.", subtext: "Nothing scheduled tonight—protect this time." },
  { message: "You don't need to optimize this hour.", subtext: "Sometimes just being is enough." },
  { message: "Rest is not a reward. It's a requirement.", subtext: "Take what you need." },
  { message: "Your worth isn't measured by productivity.", subtext: "It's okay to slow down." },
  { message: "Stillness is not laziness.", subtext: "Your mind and body need recovery." },
];

export function RestPermission() {
  const { user } = useAuth();
  const [message, setMessage] = useState(restMessages[0]);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (user) {
      checkIfShouldShow();
    }
  }, [user]);

  const checkIfShouldShow = async () => {
    if (!user) return;

    const now = new Date();
    const hour = now.getHours();
    
    // Only show in evening hours (after 6pm)
    if (hour < 18) return;

    const todayStart = startOfDay(now).toISOString();
    const todayEnd = endOfDay(now).toISOString();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();

    // Check today's activities - if user has been active, they deserve rest
    const [exerciseResult, goalsResult, downtimeResult] = await Promise.all([
      supabase
        .from('exercise_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('logged_at', todayStart)
        .lte('logged_at', todayEnd),
      supabase
        .from('goal_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('logged_at', todayStart)
        .lte('logged_at', todayEnd),
      supabase
        .from('downtime_logs')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .gte('logged_at', todayStart)
        .lte('logged_at', todayEnd),
    ]);

    const hasActivityToday = 
      (exerciseResult.data?.length || 0) > 0 || 
      (goalsResult.data?.length || 0) > 0;
    
    const totalDowntime = (downtimeResult.data || [])
      .reduce((sum, log) => sum + log.duration_minutes, 0);

    // Show if user has been active OR has low downtime
    if (hasActivityToday || totalDowntime < 30) {
      // Select a random message
      const randomIndex = Math.floor(Math.random() * restMessages.length);
      setMessage(restMessages[randomIndex]);
      setIsVisible(true);
    }
  };

  if (!isVisible || isDismissed) return null;

  return (
    <Card className="bg-gradient-to-r from-rose-950/30 to-orange-950/30 border-rose-800/20 animate-fade-in-up overflow-hidden relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground"
        onClick={() => setIsDismissed(true)}
      >
        <X className="w-4 h-4" />
      </Button>
      <CardContent className="py-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0">
          <Heart className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <p className="font-medium text-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {message.message}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {message.subtext}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
