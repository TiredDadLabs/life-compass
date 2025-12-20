import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Moon, Sunrise, BookOpen, Dumbbell, MessageCircle, Music, Coffee, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const offlineActivities = [
  { icon: BookOpen, label: 'Read a book', color: 'text-amber-500' },
  { icon: Dumbbell, label: 'Stretch or walk', color: 'text-emerald-500' },
  { icon: MessageCircle, label: 'Talk to someone', color: 'text-blue-500' },
  { icon: Music, label: 'Listen to music', color: 'text-purple-500' },
  { icon: Coffee, label: 'Make tea/coffee', color: 'text-orange-500' },
  { icon: Moon, label: 'Prepare for sleep', color: 'text-indigo-500' },
];

export function ShutdownMode() {
  const { user } = useAuth();
  const [isShutdownActive, setIsShutdownActive] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [suggestedActivity, setSuggestedActivity] = useState(offlineActivities[0]);

  useEffect(() => {
    if (user) {
      checkActiveSession();
    }
  }, [user]);

  useEffect(() => {
    // Randomly select an activity on mount
    const randomIndex = Math.floor(Math.random() * offlineActivities.length);
    setSuggestedActivity(offlineActivities[randomIndex]);
  }, []);

  const checkActiveSession = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('shutdown_sessions')
      .select('*')
      .eq('user_id', user.id)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setIsShutdownActive(true);
      setCurrentSessionId(data[0].id);
    }
  };

  const handleStartShutdown = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('shutdown_sessions')
        .insert({
          user_id: user.id,
          suggested_activity: suggestedActivity.label,
        })
        .select()
        .single();

      if (error) throw error;

      setIsShutdownActive(true);
      setCurrentSessionId(data.id);
      toast.success("Shutdown mode activated. You've earned this rest.");
    } catch (error) {
      console.error('Error starting shutdown:', error);
      toast.error('Failed to start shutdown mode');
    }
  };

  const handleEndShutdown = async () => {
    if (!user || !currentSessionId) return;

    try {
      const { error } = await supabase
        .from('shutdown_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', currentSessionId);

      if (error) throw error;

      setIsShutdownActive(false);
      setCurrentSessionId(null);
      toast.success('Welcome back');
    } catch (error) {
      console.error('Error ending shutdown:', error);
      toast.error('Failed to end shutdown mode');
    }
  };

  const hour = new Date().getHours();
  const isEvening = hour >= 18 || hour < 6;
  const ActivityIcon = suggestedActivity.icon;

  if (isShutdownActive) {
    return (
      <Card className="bg-gradient-to-br from-indigo-950/50 to-purple-950/50 border-indigo-800/30 animate-fade-in-up">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/20 flex items-center justify-center">
            <Moon className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-display text-lg text-foreground">Shutdown Mode Active</h3>
            <p className="text-muted-foreground text-sm mt-1">
              You're allowed to stop optimizing today.
            </p>
          </div>
          <div className="p-4 bg-background/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ActivityIcon className={`w-5 h-5 ${suggestedActivity.color}`} />
              <span className="text-sm font-medium text-foreground">{suggestedActivity.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">Suggested offline activity</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEndShutdown}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            End Shutdown
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Only show the button prominently in the evening
  if (!isEvening) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="py-4">
          <Button
            variant="ghost"
            onClick={handleStartShutdown}
            className="w-full text-muted-foreground hover:text-foreground justify-center"
          >
            <Moon className="w-4 h-4 mr-2" />
            Close the Day
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-indigo-950/50 border-indigo-800/20 animate-fade-in-up">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Sunrise className="w-5 h-5 text-amber-400" />
          Evening Wind-Down
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          It's getting late. Ready to close the day and step away from screens?
        </p>
        
        <Button
          onClick={handleStartShutdown}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Moon className="w-4 h-4 mr-2" />
          Close the Day
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Notifications will be quieted. You've earned rest.
        </p>
      </CardContent>
    </Card>
  );
}
