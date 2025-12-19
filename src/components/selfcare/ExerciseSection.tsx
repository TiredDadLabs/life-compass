import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dumbbell, Heart, Footprints, Zap, MoreHorizontal, Plus, Trash2, Settings2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type ActivityType = 'strength' | 'cardio' | 'walk' | 'mobility' | 'other';

interface ExerciseLog {
  id: string;
  activity_type: ActivityType;
  duration_minutes: number;
  note: string | null;
  logged_at: string;
}

const activityConfig: Record<ActivityType, { icon: React.ComponentType<{ className?: string }>, label: string, color: string }> = {
  strength: { icon: Dumbbell, label: 'Strength', color: 'text-primary' },
  cardio: { icon: Heart, label: 'Cardio', color: 'text-destructive' },
  walk: { icon: Footprints, label: 'Walk', color: 'text-success' },
  mobility: { icon: Zap, label: 'Mobility', color: 'text-highlight' },
  other: { icon: MoreHorizontal, label: 'Other', color: 'text-muted-foreground' },
};

export function ExerciseSection() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  
  // Form state
  const [activityType, setActivityType] = useState<ActivityType>('walk');
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
      const [logsRes, goalRes] = await Promise.all([
        supabase
          .from('exercise_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: false })
          .limit(50),
        supabase
          .from('exercise_goals')
          .select('*')
          .eq('user_id', user.id)
          .single()
      ]);

      if (logsRes.data) setLogs(logsRes.data as ExerciseLog[]);
      if (goalRes.data) setWeeklyGoal(goalRes.data.sessions_per_week);
    } catch (error) {
      console.error('Error fetching exercise data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  
  const thisWeekLogs = logs.filter(log => 
    isWithinInterval(new Date(log.logged_at), { start: weekStart, end: weekEnd })
  );

  const sessionsThisWeek = thisWeekLogs.length;
  const progressPercent = Math.min((sessionsThisWeek / weeklyGoal) * 100, 100);

  const handleSubmit = async () => {
    if (!user || !duration) return;
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('exercise_logs')
        .insert({
          user_id: user.id,
          activity_type: activityType,
          duration_minutes: parseInt(duration),
          note: note.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      setLogs([data as ExerciseLog, ...logs]);
      setShowForm(false);
      setNote('');
      setDuration('30');
      toast.success('Activity logged! You usually feel better after movement.');
    } catch (error) {
      console.error('Error logging activity:', error);
      toast.error('Failed to log activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      await supabase.from('exercise_logs').delete().eq('id', id);
      setLogs(logs.filter(l => l.id !== id));
      toast.success('Activity removed');
    } catch (error) {
      toast.error('Failed to remove activity');
    }
  };

  const handleUpdateGoal = async (newGoal: number) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('exercise_goals')
        .upsert({ 
          user_id: user.id, 
          sessions_per_week: newGoal 
        }, { 
          onConflict: 'user_id' 
        });

      if (error) throw error;
      
      setWeeklyGoal(newGoal);
      setShowGoalDialog(false);
      toast.success('Goal updated');
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to update goal');
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
      {/* Weekly Progress */}
      <Card className="shadow-card gradient-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-primary" />
              This Week
            </CardTitle>
            <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Settings2 className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Weekly Movement Goal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    How many sessions per week feels sustainable for you?
                  </p>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5, 6, 7].map(num => (
                      <Button
                        key={num}
                        variant={weeklyGoal === num ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleUpdateGoal(num)}
                      >
                        {num}x
                      </Button>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-3xl font-display font-bold text-foreground">
                {sessionsThisWeek}
              </span>
              <span className="text-muted-foreground text-sm ml-1">
                / {weeklyGoal} sessions
              </span>
            </div>
            {sessionsThisWeek >= weeklyGoal && (
              <span className="text-success text-sm font-medium">Goal reached! ✨</span>
            )}
          </div>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {sessionsThisWeek === 0 
              ? "Ready when you are. Even a short walk counts."
              : sessionsThisWeek < weeklyGoal 
                ? `${weeklyGoal - sessionsThisWeek} more to go — you've got this.`
                : "Beautiful consistency this week."}
          </p>
        </CardContent>
      </Card>

      {/* Log Activity */}
      {!showForm ? (
        <Button 
          onClick={() => setShowForm(true)} 
          className="w-full gradient-horizon text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Movement
        </Button>
      ) : (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Log Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm mb-2 block">Activity Type</Label>
              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(activityConfig) as ActivityType[]).map(type => {
                  const config = activityConfig[type];
                  const Icon = config.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => setActivityType(type)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-smooth ${
                        activityType === type 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${config.color}`} />
                      <span className="text-xs">{config.label}</span>
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
                  {[10, 15, 20, 30, 45, 60, 90].map(mins => (
                    <SelectItem key={mins} value={mins.toString()}>
                      {mins} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Note (optional)</Label>
              <Textarea
                placeholder="Quick walk between meetings..."
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
                {isSubmitting ? 'Saving...' : 'Log Activity'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activities */}
      {thisWeekLogs.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              This Week's Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {thisWeekLogs.map(log => {
              const config = activityConfig[log.activity_type];
              const Icon = config.icon;
              return (
                <div 
                  key={log.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-background ${config.color}`}>
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
