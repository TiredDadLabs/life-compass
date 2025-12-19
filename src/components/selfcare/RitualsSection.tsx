import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sparkles, Plus, Check, Trash2, Sun, Sunset, Moon as MoonIcon, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';

interface Ritual {
  id: string;
  name: string;
  time_of_day: TimeOfDay;
  reminder_enabled: boolean;
  is_active: boolean;
}

interface RitualCompletion {
  id: string;
  ritual_id: string;
  completed_date: string;
}

const timeConfig: Record<TimeOfDay, { icon: React.ComponentType<{ className?: string }>, label: string }> = {
  morning: { icon: Sun, label: 'Morning' },
  afternoon: { icon: Sunset, label: 'Afternoon' },
  evening: { icon: MoonIcon, label: 'Evening' },
  anytime: { icon: Clock, label: 'Anytime' },
};

export function RitualsSection() {
  const { user } = useAuth();
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [completions, setCompletions] = useState<RitualCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      const [ritualsRes, completionsRes] = await Promise.all([
        supabase
          .from('personal_rituals')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: true }),
        supabase
          .from('ritual_completions')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed_date', today)
      ]);

      if (ritualsRes.data) setRituals(ritualsRes.data as Ritual[]);
      if (completionsRes.data) setCompletions(completionsRes.data);
    } catch (error) {
      console.error('Error fetching rituals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRitual = async () => {
    if (!user || !name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('personal_rituals')
        .insert({
          user_id: user.id,
          name: name.trim(),
          time_of_day: timeOfDay,
          reminder_enabled: reminderEnabled,
        })
        .select()
        .single();

      if (error) throw error;
      
      setRituals([...rituals, data as Ritual]);
      setShowForm(false);
      setName('');
      setTimeOfDay('morning');
      setReminderEnabled(false);
      toast.success('Ritual created');
    } catch (error) {
      console.error('Error creating ritual:', error);
      toast.error('Failed to create ritual');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCompletion = async (ritual: Ritual) => {
    if (!user) return;

    const existingCompletion = completions.find(c => c.ritual_id === ritual.id);

    try {
      if (existingCompletion) {
        // Remove completion
        await supabase
          .from('ritual_completions')
          .delete()
          .eq('id', existingCompletion.id);
        
        setCompletions(completions.filter(c => c.id !== existingCompletion.id));
        toast.success('Unmarked');
      } else {
        // Add completion
        const { data, error } = await supabase
          .from('ritual_completions')
          .insert({
            ritual_id: ritual.id,
            user_id: user.id,
            completed_date: today,
          })
          .select()
          .single();

        if (error) throw error;
        
        setCompletions([...completions, data]);
        toast.success('Beautiful. Small rituals matter.');
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
      toast.error('Failed to update');
    }
  };

  const handleDeleteRitual = async (id: string) => {
    try {
      await supabase.from('personal_rituals').delete().eq('id', id);
      setRituals(rituals.filter(r => r.id !== id));
      toast.success('Ritual removed');
    } catch (error) {
      toast.error('Failed to remove ritual');
    }
  };

  const isCompleted = (ritualId: string) => 
    completions.some(c => c.ritual_id === ritualId);

  const completedCount = completions.length;
  const totalRituals = rituals.length;

  // Group rituals by time of day
  const groupedRituals = rituals.reduce((acc, ritual) => {
    const time = ritual.time_of_day || 'anytime';
    if (!acc[time]) acc[time] = [];
    acc[time].push(ritual);
    return acc;
  }, {} as Record<TimeOfDay, Ritual[]>);

  const timeOrder: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'anytime'];

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
      {/* Today's Progress */}
      {totalRituals > 0 && (
        <Card className="shadow-card gradient-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-highlight" />
              Today's Rituals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-2xl font-display font-bold text-foreground">
                  {completedCount} / {totalRituals}
                </p>
                <p className="text-sm text-muted-foreground">
                  {completedCount === 0 
                    ? "Ready when you are" 
                    : completedCount === totalRituals 
                      ? "All rituals complete ✨"
                      : "Taking care of yourself"}
                </p>
              </div>
              <div className="flex -space-x-2">
                {rituals.slice(0, 5).map(ritual => {
                  const completed = isCompleted(ritual.id);
                  return (
                    <div 
                      key={ritual.id}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 border-card ${
                        completed 
                          ? 'bg-success text-success-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {completed ? <Check className="w-4 h-4" /> : ritual.name.charAt(0)}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rituals List */}
      {timeOrder.map(time => {
        const timeRituals = groupedRituals[time];
        if (!timeRituals?.length) return null;
        
        const config = timeConfig[time];
        const Icon = config.icon;

        return (
          <Card key={time} className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {config.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {timeRituals.map(ritual => {
                const completed = isCompleted(ritual.id);
                return (
                  <div 
                    key={ritual.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-smooth ${
                      completed 
                        ? 'border-success/30 bg-success/5' 
                        : 'border-border bg-secondary/30'
                    }`}
                  >
                    <button
                      onClick={() => handleToggleCompletion(ritual)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-smooth ${
                        completed 
                          ? 'border-success bg-success text-success-foreground' 
                          : 'border-muted-foreground'
                      }`}>
                        {completed && <Check className="w-4 h-4" />}
                      </div>
                      <span className={`font-medium ${completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {ritual.name}
                      </span>
                    </button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteRitual(ritual.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Add Ritual */}
      {!showForm ? (
        <Button 
          onClick={() => setShowForm(true)} 
          variant={totalRituals === 0 ? 'default' : 'outline'}
          className={totalRituals === 0 ? 'w-full gradient-horizon text-primary-foreground' : 'w-full'}
        >
          <Plus className="w-4 h-4 mr-2" />
          {totalRituals === 0 ? 'Create Your First Ritual' : 'Add Ritual'}
        </Button>
      ) : (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">New Personal Ritual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm mb-2 block">Ritual Name</Label>
              <Input
                placeholder="e.g., Morning coffee alone, Evening walk..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm mb-2 block">Time of Day</Label>
              <div className="grid grid-cols-4 gap-2">
                {timeOrder.map(time => {
                  const config = timeConfig[time];
                  const Icon = config.icon;
                  return (
                    <button
                      key={time}
                      onClick={() => setTimeOfDay(time)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-smooth ${
                        timeOfDay === time 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-primary" />
                      <span className="text-xs">{config.label}</span>
                    </button>
                  );
                })}
              </div>
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
                onClick={handleCreateRitual}
                disabled={!name.trim() || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Creating...' : 'Create Ritual'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {totalRituals === 0 && !showForm && (
        <Card className="shadow-soft">
          <CardContent className="py-8 text-center">
            <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-display font-semibold text-foreground mb-2">
              Define Your Rituals
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Personal rituals are small, grounding habits that feel like you. 
              No streaks, no pressure — just intention.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
