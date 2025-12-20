import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Smartphone, Target, Wind, Check, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

interface ScreenTimeLog {
  id: string;
  duration_minutes: number;
  intent_type: string;
  category: string | null;
  logged_at: string;
}

interface ScreenTimeStats {
  todayTotal: number;
  todayIntentional: number;
  todayPassive: number;
  weekPassive: number;
}

export function ScreenTimeCard() {
  const { user } = useAuth();
  const [isLogging, setIsLogging] = useState(false);
  const [duration, setDuration] = useState([30]);
  const [intentType, setIntentType] = useState<'intentional' | 'passive'>('intentional');
  const [category, setCategory] = useState<string>('work');
  const [stats, setStats] = useState<ScreenTimeStats>({
    todayTotal: 0,
    todayIntentional: 0,
    todayPassive: 0,
    weekPassive: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNudge, setShowNudge] = useState(false);

  const intentionalCategories = [
    { value: 'work', label: 'Work' },
    { value: 'communication', label: 'Communication' },
    { value: 'learning', label: 'Learning' },
    { value: 'creating', label: 'Creating' },
  ];

  const passiveCategories = [
    { value: 'scrolling', label: 'Scrolling' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'news', label: 'News' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  useEffect(() => {
    // Show nudge if passive time exceeds 60 minutes today
    if (stats.todayPassive > 60) {
      setShowNudge(true);
    }
  }, [stats.todayPassive]);

  const fetchStats = async () => {
    if (!user) return;

    const now = new Date();
    const todayStart = startOfDay(now).toISOString();
    const todayEnd = endOfDay(now).toISOString();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();

    // Fetch today's logs
    const { data: todayLogs } = await supabase
      .from('screen_time_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', todayStart)
      .lte('logged_at', todayEnd);

    // Fetch week's passive logs
    const { data: weekLogs } = await supabase
      .from('screen_time_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('intent_type', 'passive')
      .gte('logged_at', weekStart)
      .lte('logged_at', weekEnd);

    const todayTotal = (todayLogs || []).reduce((sum, log) => sum + log.duration_minutes, 0);
    const todayIntentional = (todayLogs || [])
      .filter(log => log.intent_type === 'intentional')
      .reduce((sum, log) => sum + log.duration_minutes, 0);
    const todayPassive = (todayLogs || [])
      .filter(log => log.intent_type === 'passive')
      .reduce((sum, log) => sum + log.duration_minutes, 0);
    const weekPassive = (weekLogs || []).reduce((sum, log) => sum + log.duration_minutes, 0);

    setStats({ todayTotal, todayIntentional, todayPassive, weekPassive });
  };

  const handleLogTime = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('screen_time_logs').insert({
        user_id: user.id,
        duration_minutes: duration[0],
        intent_type: intentType,
        category,
        logged_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success('Screen time logged');
      setIsLogging(false);
      setDuration([30]);
      fetchStats();
    } catch (error) {
      console.error('Error logging screen time:', error);
      toast.error('Failed to log screen time');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (isLogging) {
    return (
      <Card className="bg-card/50 border-border/50 animate-fade-in-up">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            Log Screen Time
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Duration */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Duration: {formatDuration(duration[0])}</Label>
            <Slider
              value={duration}
              onValueChange={setDuration}
              min={5}
              max={180}
              step={5}
              className="w-full"
            />
          </div>

          {/* Intent Type */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Was this time...</Label>
            <RadioGroup
              value={intentType}
              onValueChange={(v) => {
                setIntentType(v as 'intentional' | 'passive');
                setCategory(v === 'intentional' ? 'work' : 'scrolling');
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="intentional" id="intentional" />
                <Label htmlFor="intentional" className="flex items-center gap-1.5 cursor-pointer">
                  <Target className="w-4 h-4 text-primary" />
                  Intentional
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="passive" id="passive" />
                <Label htmlFor="passive" className="flex items-center gap-1.5 cursor-pointer">
                  <Wind className="w-4 h-4 text-muted-foreground" />
                  Passive/Drift
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Category */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Category</Label>
            <div className="flex flex-wrap gap-2">
              {(intentType === 'intentional' ? intentionalCategories : passiveCategories).map((cat) => (
                <Badge
                  key={cat.value}
                  variant={category === cat.value ? 'default' : 'outline'}
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => setCategory(cat.value)}
                >
                  {cat.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setIsLogging(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogTime}
              disabled={isSubmitting}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-1" />
              Log
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50 animate-fade-in-up">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            Screen Time
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLogging(true)}
            className="text-primary hover:text-primary"
          >
            <Plus className="w-4 h-4 mr-1" />
            Log
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <p className="text-2xl font-semibold text-foreground">{formatDuration(stats.todayTotal)}</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <p className="text-2xl font-semibold text-primary">{formatDuration(stats.todayIntentional)}</p>
            <p className="text-xs text-muted-foreground">Intentional</p>
          </div>
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <p className="text-2xl font-semibold text-muted-foreground">{formatDuration(stats.todayPassive)}</p>
            <p className="text-xs text-muted-foreground">Passive</p>
          </div>
        </div>

        {/* Nudge */}
        {showNudge && (
          <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-sm">
            <p className="text-foreground">
              You've had about <span className="font-medium">{formatDuration(stats.todayPassive)}</span> of passive screen time today.
            </p>
            <p className="text-muted-foreground mt-1">
              Want to switch gears? A short walk or stretch might feel good.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs"
              onClick={() => setShowNudge(false)}
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Week insight */}
        {stats.weekPassive > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {formatDuration(stats.weekPassive)} passive time this week
          </p>
        )}
      </CardContent>
    </Card>
  );
}
