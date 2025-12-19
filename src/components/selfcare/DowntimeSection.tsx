import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Moon, User, Sofa, BookOpen, Smartphone, Plus, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval, differenceInDays } from 'date-fns';

type DowntimeType = 'alone_time' | 'rest' | 'leisure' | 'phone_free';

interface DowntimeLog {
  id: string;
  downtime_type: DowntimeType;
  duration_minutes: number;
  note: string | null;
  logged_at: string;
}

const downtimeConfig: Record<DowntimeType, { icon: React.ComponentType<{ className?: string }>, label: string, description: string }> = {
  alone_time: { icon: User, label: 'Alone Time', description: 'Time just for yourself' },
  rest: { icon: Sofa, label: 'Rest', description: 'Doing nothing, recharging' },
  leisure: { icon: BookOpen, label: 'Leisure', description: 'Reading, TV, hobbies' },
  phone_free: { icon: Smartphone, label: 'Phone-Free', description: 'Unplugged moments' },
};

export function DowntimeSection() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<DowntimeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [downtimeType, setDowntimeType] = useState<DowntimeType>('alone_time');
  const [duration, setDuration] = useState('30');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('downtime_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', subDays(new Date(), 14).toISOString())
        .order('logged_at', { ascending: false });

      if (error) throw error;
      if (data) setLogs(data as DowntimeLog[]);
    } catch (error) {
      console.error('Error fetching downtime data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate awareness metrics
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  
  const thisWeekLogs = logs.filter(log => 
    isWithinInterval(new Date(log.logged_at), { start: weekStart, end: weekEnd })
  );

  const totalMinutesThisWeek = thisWeekLogs.reduce((sum, log) => sum + log.duration_minutes, 0);
  const totalHoursThisWeek = Math.round(totalMinutesThisWeek / 60 * 10) / 10;
  const sessionsThisWeek = thisWeekLogs.length;

  // Days without downtime calculation
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i);
    return format(date, 'yyyy-MM-dd');
  });

  const daysWithDowntime = new Set(
    logs
      .filter(log => last7Days.includes(format(new Date(log.logged_at), 'yyyy-MM-dd')))
      .map(log => format(new Date(log.logged_at), 'yyyy-MM-dd'))
  );

  const daysWithoutDowntime = 7 - daysWithDowntime.size;

  // Days without alone time specifically
  const daysWithAloneTime = new Set(
    logs
      .filter(log => 
        log.downtime_type === 'alone_time' && 
        last7Days.includes(format(new Date(log.logged_at), 'yyyy-MM-dd'))
      )
      .map(log => format(new Date(log.logged_at), 'yyyy-MM-dd'))
  );

  const consecutiveDaysWithoutAloneTime = 7 - daysWithAloneTime.size;

  // Generate awareness messages
  const getAwarenessMessages = () => {
    const messages: { type: 'warning' | 'gentle' | 'positive', text: string }[] = [];

    if (daysWithoutDowntime >= 5) {
      messages.push({
        type: 'warning',
        text: "You haven't had much downtime in the last 7 days. Your rest matters."
      });
    } else if (daysWithoutDowntime >= 3) {
      messages.push({
        type: 'gentle',
        text: `${daysWithoutDowntime} days without logged rest this week. Consider protecting some downtime.`
      });
    }

    if (consecutiveDaysWithoutAloneTime >= 5) {
      messages.push({
        type: 'warning',
        text: `${consecutiveDaysWithoutAloneTime} days without alone time. That's important too.`
      });
    }

    if (totalMinutesThisWeek < 60 && sessionsThisWeek > 0) {
      messages.push({
        type: 'gentle',
        text: "Your downtime sessions have been brief. Even longer rest periods can help."
      });
    }

    if (messages.length === 0 && totalMinutesThisWeek >= 120) {
      messages.push({
        type: 'positive',
        text: "You've been protecting your rest this week. That takes intention."
      });
    }

    return messages;
  };

  const awarenessMessages = getAwarenessMessages();

  const handleSubmit = async () => {
    if (!user || !duration) return;
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('downtime_logs')
        .insert({
          user_id: user.id,
          downtime_type: downtimeType,
          duration_minutes: parseInt(duration),
          note: note.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      setLogs([data as DowntimeLog, ...logs]);
      setShowForm(false);
      setNote('');
      setDuration('30');
      toast.success('Rest logged. You deserve this time.');
    } catch (error) {
      console.error('Error logging downtime:', error);
      toast.error('Failed to log downtime');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      await supabase.from('downtime_logs').delete().eq('id', id);
      setLogs(logs.filter(l => l.id !== id));
      toast.success('Entry removed');
    } catch (error) {
      toast.error('Failed to remove entry');
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Awareness Alerts */}
      {awarenessMessages.map((msg, i) => (
        <Card 
          key={i}
          className={`shadow-soft ${
            msg.type === 'warning' 
              ? 'bg-gentle-alert/50 border-gentle-alert' 
              : msg.type === 'positive'
                ? 'bg-success/10 border-success/30'
                : 'bg-secondary/50 border-border'
          }`}
        >
          <CardContent className="py-4 flex items-start gap-3">
            {msg.type === 'warning' && (
              <AlertCircle className="w-5 h-5 text-gentle-alert-foreground shrink-0 mt-0.5" />
            )}
            <p className={`text-sm leading-relaxed ${
              msg.type === 'warning' 
                ? 'text-gentle-alert-foreground' 
                : msg.type === 'positive'
                  ? 'text-success'
                  : 'text-muted-foreground'
            }`}>
              {msg.text}
            </p>
          </CardContent>
        </Card>
      ))}

      {/* Weekly Overview */}
      <Card className="shadow-card gradient-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Moon className="w-5 h-5 text-primary" />
            This Week's Rest
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-secondary/50">
              <p className="text-2xl font-display font-bold text-foreground">
                {totalHoursThisWeek}
              </p>
              <p className="text-xs text-muted-foreground">hours logged</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/50">
              <p className="text-2xl font-display font-bold text-foreground">
                {sessionsThisWeek}
              </p>
              <p className="text-xs text-muted-foreground">sessions</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/50">
              <p className={`text-2xl font-display font-bold ${
                daysWithoutDowntime >= 3 ? 'text-gentle-alert-foreground' : 'text-foreground'
              }`}>
                {7 - daysWithoutDowntime}
              </p>
              <p className="text-xs text-muted-foreground">days with rest</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Downtime */}
      {!showForm ? (
        <Button 
          onClick={() => setShowForm(true)} 
          className="w-full gradient-horizon text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Downtime
        </Button>
      ) : (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Log Rest Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm mb-2 block">Type of Rest</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(downtimeConfig) as DowntimeType[]).map(type => {
                  const config = downtimeConfig[type];
                  const Icon = config.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => setDowntimeType(type)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-smooth text-left ${
                        downtimeType === type 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{config.label}</p>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Duration (minutes)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[15, 30, 45, 60, 90, 120, 180].map(mins => (
                    <SelectItem key={mins} value={mins.toString()}>
                      {mins >= 60 ? `${mins / 60} hour${mins > 60 ? 's' : ''}` : `${mins} minutes`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Note (optional)</Label>
              <Textarea
                placeholder="What did you do to rest?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="resize-none"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Saving...' : 'Log Rest'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Rest */}
      {thisWeekLogs.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Recent Rest
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {thisWeekLogs.slice(0, 5).map(log => {
              const config = downtimeConfig[log.downtime_type];
              const Icon = config.icon;
              return (
                <div 
                  key={log.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-background text-primary">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{config.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.duration_minutes} min • {format(new Date(log.logged_at), 'EEE')}
                        {log.note && ` • ${log.note}`}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteLog(log.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
