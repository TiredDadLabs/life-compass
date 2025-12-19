import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Heart, Zap, Brain, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';

interface MoodCheckin {
  id: string;
  date: string;
  mood_score: number | null;
  stress_level: 'low' | 'medium' | 'high' | null;
  energy_level: number | null;
  drained_by: string | null;
  energized_by: string | null;
}

const moodEmojis = ['😔', '😕', '😐', '🙂', '😊'];
const energyLabels = ['Depleted', 'Low', 'Okay', 'Good', 'High'];

export function MoodCheckinSection() {
  const { user } = useAuth();
  const [todayCheckin, setTodayCheckin] = useState<MoodCheckin | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<MoodCheckin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  
  // Form state
  const [moodScore, setMoodScore] = useState(3);
  const [stressLevel, setStressLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [energyLevel, setEnergyLevel] = useState(3);
  const [drainedBy, setDrainedBy] = useState('');
  const [energizedBy, setEnergizedBy] = useState('');

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('mood_checkins')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', format(subDays(new Date(), 14), 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        const typedData = data as MoodCheckin[];
        const todayEntry = typedData.find(c => c.date === today);
        if (todayEntry) {
          setTodayCheckin(todayEntry);
          setMoodScore(todayEntry.mood_score || 3);
          setStressLevel(todayEntry.stress_level || 'medium');
          setEnergyLevel(todayEntry.energy_level || 3);
          setDrainedBy(todayEntry.drained_by || '');
          setEnergizedBy(todayEntry.energized_by || '');
        }
        setRecentCheckins(typedData.filter(c => c.date !== today));
      }
    } catch (error) {
      console.error('Error fetching mood data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const checkinData = {
        user_id: user.id,
        date: today,
        mood_score: moodScore,
        stress_level: stressLevel,
        energy_level: energyLevel,
        drained_by: drainedBy.trim() || null,
        energized_by: energizedBy.trim() || null,
      };

      if (todayCheckin) {
        const { error } = await supabase
          .from('mood_checkins')
          .update(checkinData)
          .eq('id', todayCheckin.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('mood_checkins')
          .insert(checkinData)
          .select()
          .single();
        if (error) throw error;
        setTodayCheckin(data as MoodCheckin);
      }
      
      toast.success('Check-in saved. Thank you for tuning in.');
    } catch (error) {
      console.error('Error saving check-in:', error);
      toast.error('Failed to save check-in');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate insights
  const getInsight = () => {
    if (recentCheckins.length < 3) return null;

    const avgMood = recentCheckins.reduce((sum, c) => sum + (c.mood_score || 3), 0) / recentCheckins.length;
    const avgEnergy = recentCheckins.reduce((sum, c) => sum + (c.energy_level || 3), 0) / recentCheckins.length;
    const highStressDays = recentCheckins.filter(c => c.stress_level === 'high').length;

    if (highStressDays >= 3 && avgEnergy < 3) {
      return "High stress and low energy detected recently. This is a signal to slow down if you can.";
    }

    if (avgMood <= 2.5) {
      return "Your mood has been lower lately. Be gentle with yourself — this season will pass.";
    }

    if (avgMood >= 4 && avgEnergy >= 4) {
      return "You've been feeling good lately. Notice what's working and protect it.";
    }

    return null;
  };

  const insight = getInsight();

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
      {/* Today's Check-in */}
      <Card className="shadow-card gradient-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              How are you feeling?
            </CardTitle>
            {todayCheckin && (
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                Updated today
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mood */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Mood</Label>
            <div className="flex justify-between items-center">
              {moodEmojis.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => setMoodScore(i + 1)}
                  className={`text-3xl p-2 rounded-xl transition-smooth ${
                    moodScore === i + 1 
                      ? 'bg-primary/20 scale-110' 
                      : 'hover:bg-secondary opacity-60 hover:opacity-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Stress Level */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Stress Level</Label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setStressLevel(level)}
                  className={`flex-1 py-3 px-4 rounded-xl border transition-smooth text-sm font-medium ${
                    stressLevel === level 
                      ? level === 'high' 
                        ? 'border-destructive bg-destructive/10 text-destructive'
                        : level === 'medium'
                          ? 'border-highlight bg-highlight/10 text-highlight-foreground'
                          : 'border-success bg-success/10 text-success'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Energy Level */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="text-sm text-muted-foreground">Energy</Label>
              <span className="text-sm text-foreground">{energyLabels[energyLevel - 1]}</span>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[energyLevel]}
                onValueChange={(v) => setEnergyLevel(v[0])}
                min={1}
                max={5}
                step={1}
                className="flex-1"
              />
              <Zap className="w-4 h-4 text-highlight" />
            </div>
          </div>

          {/* Reflection Toggle */}
          <Button
            variant="ghost"
            onClick={() => setShowReflection(!showReflection)}
            className="w-full text-muted-foreground text-sm"
          >
            <Brain className="w-4 h-4 mr-2" />
            {showReflection ? 'Hide' : 'Add'} Reflection
          </Button>

          {/* Reflection Questions */}
          {showReflection && (
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-sm mb-2 block text-muted-foreground">
                  What drained you today?
                </Label>
                <Textarea
                  placeholder="Meetings, difficult conversations, lack of sleep..."
                  value={drainedBy}
                  onChange={(e) => setDrainedBy(e.target.value)}
                  className="resize-none"
                  rows={2}
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block text-muted-foreground">
                  What gave you energy?
                </Label>
                <Textarea
                  placeholder="A good conversation, exercise, completing a task..."
                  value={energizedBy}
                  onChange={(e) => setEnergizedBy(e.target.value)}
                  className="resize-none"
                  rows={2}
                />
              </div>
            </div>
          )}

          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? 'Saving...' : todayCheckin ? 'Update Check-in' : 'Save Check-in'}
          </Button>
        </CardContent>
      </Card>

      {/* Insight */}
      {insight && (
        <Card className="shadow-soft bg-gentle-alert/50 border-gentle-alert">
          <CardContent className="py-4">
            <p className="text-sm text-gentle-alert-foreground leading-relaxed">
              {insight}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent History */}
      {recentCheckins.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Recent Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentCheckins.slice(0, 7).map(checkin => (
                <div 
                  key={checkin.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {moodEmojis[(checkin.mood_score || 3) - 1]}
                    </span>
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(checkin.date), 'EEEE')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Energy: {energyLabels[(checkin.energy_level || 3) - 1]} • 
                        Stress: {checkin.stress_level || 'medium'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(checkin.date), 'MMM d')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
