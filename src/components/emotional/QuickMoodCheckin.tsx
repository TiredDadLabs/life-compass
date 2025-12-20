import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Heart, Zap, Check, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const moodEmojis = ['😔', '😕', '😐', '🙂', '😊'];
const energyEmojis = ['🔋', '🪫', '⚡', '💫', '🌟'];

export function QuickMoodCheckin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedEnergy, setSelectedEnergy] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (user) {
      checkTodayStatus();
    }
  }, [user]);

  const checkTodayStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('mood_checkins')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (data) {
        setHasCheckedIn(true);
      }
    } catch (error) {
      console.error('Error checking mood status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSave = async () => {
    if (!user || selectedMood === null || selectedEnergy === null) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('mood_checkins')
        .upsert({
          user_id: user.id,
          date: today,
          mood_score: selectedMood,
          energy_level: selectedEnergy,
        }, {
          onConflict: 'user_id,date',
        });

      if (error) throw error;
      
      setHasCheckedIn(true);
      toast.success('Check-in saved ✨');
    } catch (error) {
      console.error('Error saving quick check-in:', error);
      toast.error('Failed to save check-in');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return null;

  if (hasCheckedIn) {
    return (
      <Card className="border-border/50 bg-emerald-950/20 border-emerald-800/30">
        <CardContent className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Checked in today</p>
              <p className="text-xs text-muted-foreground">Thanks for tuning in with yourself</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/self-care')}
            className="text-muted-foreground"
          >
            <span>Details</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-400" />
          Quick Check-in
          <span className="text-xs font-normal text-muted-foreground ml-auto">~3 seconds</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mood Selection */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">How's your mood?</p>
          <div className="flex justify-between">
            {moodEmojis.map((emoji, i) => (
              <button
                key={`mood-${i}`}
                onClick={() => setSelectedMood(i + 1)}
                className={`text-2xl p-2 rounded-xl transition-all ${
                  selectedMood === i + 1 
                    ? 'bg-primary/20 scale-110 ring-2 ring-primary/40' 
                    : 'opacity-50 hover:opacity-100 hover:bg-secondary'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Energy Selection */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Energy level?</p>
          <div className="flex justify-between">
            {energyEmojis.map((emoji, i) => (
              <button
                key={`energy-${i}`}
                onClick={() => setSelectedEnergy(i + 1)}
                className={`text-2xl p-2 rounded-xl transition-all ${
                  selectedEnergy === i + 1 
                    ? 'bg-amber-500/20 scale-110 ring-2 ring-amber-500/40' 
                    : 'opacity-50 hover:opacity-100 hover:bg-secondary'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleQuickSave}
          disabled={selectedMood === null || selectedEnergy === null || isSaving}
          className="w-full"
          size="sm"
        >
          {isSaving ? 'Saving...' : 'Done'}
        </Button>

        <Button
          variant="link"
          size="sm"
          onClick={() => navigate('/self-care')}
          className="w-full text-muted-foreground"
        >
          Add more detail →
        </Button>
      </CardContent>
    </Card>
  );
}
