import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Apple, Droplets, Salad, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, subDays, startOfDay } from 'date-fns';

interface NutritionCheckin {
  id: string;
  date: string;
  ate_regular_meals: boolean;
  drank_enough_water: boolean;
  ate_whole_foods: boolean;
  note: string | null;
}

export function NutritionSection() {
  const { user } = useAuth();
  const [todayCheckin, setTodayCheckin] = useState<NutritionCheckin | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<NutritionCheckin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [ateRegularMeals, setAteRegularMeals] = useState(false);
  const [drankEnoughWater, setDrankEnoughWater] = useState(false);
  const [ateWholeFoods, setAteWholeFoods] = useState(false);
  const [note, setNote] = useState('');

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
        .from('nutrition_checkins')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', format(subDays(new Date(), 7), 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        const todayEntry = data.find(c => c.date === today);
        if (todayEntry) {
          setTodayCheckin(todayEntry);
          setAteRegularMeals(todayEntry.ate_regular_meals);
          setDrankEnoughWater(todayEntry.drank_enough_water);
          setAteWholeFoods(todayEntry.ate_whole_foods);
          setNote(todayEntry.note || '');
        }
        setRecentCheckins(data.filter(c => c.date !== today));
      }
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
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
        ate_regular_meals: ateRegularMeals,
        drank_enough_water: drankEnoughWater,
        ate_whole_foods: ateWholeFoods,
        note: note.trim() || null,
      };

      if (todayCheckin) {
        const { error } = await supabase
          .from('nutrition_checkins')
          .update(checkinData)
          .eq('id', todayCheckin.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('nutrition_checkins')
          .insert(checkinData)
          .select()
          .single();
        if (error) throw error;
        setTodayCheckin(data);
      }
      
      toast.success('Check-in saved');
    } catch (error) {
      console.error('Error saving check-in:', error);
      toast.error('Failed to save check-in');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate insights
  const allCheckins = todayCheckin ? [todayCheckin, ...recentCheckins] : recentCheckins;
  const daysWithLowNutrition = allCheckins.filter(c => 
    !c.ate_regular_meals || !c.drank_enough_water
  ).length;
  
  const getInsight = () => {
    if (allCheckins.length < 3) return null;
    
    if (daysWithLowNutrition >= 3) {
      return "You've had several days with skipped meals or low hydration. Low energy often follows — be gentle with yourself.";
    }
    
    const consistentDays = allCheckins.filter(c => 
      c.ate_regular_meals && c.drank_enough_water
    ).length;
    
    if (consistentDays >= 5) {
      return "Your nourishment has been consistent this week. That's caring for yourself well.";
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

  const checkItems = [
    { 
      key: 'meals', 
      label: 'Ate regular meals today',
      description: 'Breakfast, lunch, dinner — or whatever rhythm works for you',
      icon: Apple,
      checked: ateRegularMeals,
      onChange: setAteRegularMeals
    },
    { 
      key: 'water', 
      label: 'Drank enough water',
      description: 'Staying hydrated through the day',
      icon: Droplets,
      checked: drankEnoughWater,
      onChange: setDrankEnoughWater
    },
    { 
      key: 'wholeFoods', 
      label: 'Ate mostly whole foods',
      description: 'Real ingredients that nourish you',
      icon: Salad,
      checked: ateWholeFoods,
      onChange: setAteWholeFoods
    },
  ];

  const completedCount = [ateRegularMeals, drankEnoughWater, ateWholeFoods].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Today's Check-in */}
      <Card className="shadow-card gradient-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Apple className="w-5 h-5 text-success" />
              Today's Nourishment
            </CardTitle>
            {todayCheckin && (
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                Saved
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {checkItems.map(item => {
            const Icon = item.icon;
            return (
              <div 
                key={item.key}
                className={`flex items-center justify-between p-4 rounded-xl border transition-smooth ${
                  item.checked 
                    ? 'border-success/30 bg-success/5' 
                    : 'border-border bg-secondary/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    item.checked ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <Label className="font-medium cursor-pointer">{item.label}</Label>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <Switch
                  checked={item.checked}
                  onCheckedChange={item.onChange}
                />
              </div>
            );
          })}

          <div>
            <Label className="text-sm mb-2 block text-muted-foreground">
              Notes (optional)
            </Label>
            <Textarea
              placeholder="How are you feeling about food today?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>

          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
            variant={completedCount === 3 ? 'default' : 'outline'}
          >
            {isSaving ? 'Saving...' : todayCheckin ? 'Update Check-in' : 'Save Check-in'}
          </Button>

          {completedCount === 3 && (
            <p className="text-center text-sm text-success flex items-center justify-center gap-1">
              <Check className="w-4 h-4" />
              Well nourished today
            </p>
          )}
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

      {/* Recent Days */}
      {recentCheckins.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Recent Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {recentCheckins.slice(0, 7).map(checkin => {
                const score = [
                  checkin.ate_regular_meals, 
                  checkin.drank_enough_water, 
                  checkin.ate_whole_foods
                ].filter(Boolean).length;
                
                return (
                  <div 
                    key={checkin.id}
                    className="flex-1 text-center"
                  >
                    <div className={`w-full aspect-square rounded-lg flex items-center justify-center text-sm font-medium ${
                      score === 3 
                        ? 'bg-success/20 text-success' 
                        : score >= 1 
                          ? 'bg-highlight/20 text-highlight-foreground' 
                          : 'bg-muted text-muted-foreground'
                    }`}>
                      {score}/3
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(checkin.date), 'EEE')}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
