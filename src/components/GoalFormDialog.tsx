import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Heart, Users, Dumbbell, Briefcase, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type GoalCategory = 'relationship' | 'kids' | 'health' | 'work' | 'self';

const categoryOptions: { value: GoalCategory; label: string; icon: typeof Heart; color: string }[] = [
  { value: 'relationship', label: 'Relationship', icon: Heart, color: 'text-primary' },
  { value: 'kids', label: 'Kids', icon: Users, color: 'text-highlight' },
  { value: 'health', label: 'Health', icon: Dumbbell, color: 'text-success' },
  { value: 'work', label: 'Work', icon: Briefcase, color: 'text-muted-foreground' },
  { value: 'self', label: 'Self', icon: Sparkles, color: 'text-primary' },
];

interface GoalFormData {
  name: string;
  category: string;
  target_per_week: number;
  unit: string;
  ramp_enabled: boolean;
  ramp_start: number | null;
  ramp_duration_weeks: number | null;
  ramp_current_week: number | null;
  icon: string | null;
}

interface GoalFormDialogProps {
  trigger: React.ReactNode;
  onSubmit: (data: GoalFormData) => Promise<void>;
}

export function GoalFormDialog({ trigger, onSubmit }: GoalFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState<GoalCategory>('relationship');
  const [targetPerWeek, setTargetPerWeek] = useState(3);
  const [unit, setUnit] = useState('sessions');
  const [rampEnabled, setRampEnabled] = useState(false);
  const [rampStart, setRampStart] = useState(1);
  const [rampDurationWeeks, setRampDurationWeeks] = useState(4);

  const resetForm = () => {
    setName('');
    setCategory('relationship');
    setTargetPerWeek(3);
    setUnit('sessions');
    setRampEnabled(false);
    setRampStart(1);
    setRampDurationWeeks(4);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        category,
        target_per_week: targetPerWeek,
        unit,
        ramp_enabled: rampEnabled,
        ramp_start: rampEnabled ? rampStart : null,
        ramp_duration_weeks: rampEnabled ? rampDurationWeeks : null,
        ramp_current_week: rampEnabled ? 1 : null,
        icon: null,
      });
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error('Error creating goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categoryOptions.find(c => c.value === category);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Create New Goal</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Goal Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Goal Name</Label>
            <Input
              id="name"
              placeholder="e.g., Date nights, Gym sessions, Reading"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="grid grid-cols-5 gap-2">
              {categoryOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = category === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCategory(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                      isSelected 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isSelected ? option.color : "text-muted-foreground")} />
                    <span className={cn("text-xs", isSelected ? "text-foreground font-medium" : "text-muted-foreground")}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target">Weekly Target</Label>
              <Input
                id="target"
                type="number"
                min={1}
                max={50}
                value={targetPerWeek}
                onChange={(e) => setTargetPerWeek(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sessions">Sessions</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ramping Configuration */}
          <div className="space-y-4 p-4 rounded-xl bg-accent/50 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-highlight" />
                <Label htmlFor="ramp-toggle" className="cursor-pointer">
                  Gradual Ramping
                </Label>
              </div>
              <Switch
                id="ramp-toggle"
                checked={rampEnabled}
                onCheckedChange={setRampEnabled}
              />
            </div>
            
            {rampEnabled && (
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  Start small and build up to your target over time.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ramp-start">Start at</Label>
                    <Input
                      id="ramp-start"
                      type="number"
                      min={1}
                      max={targetPerWeek - 1}
                      value={rampStart}
                      onChange={(e) => setRampStart(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ramp-weeks">Over weeks</Label>
                    <Input
                      id="ramp-weeks"
                      type="number"
                      min={2}
                      max={12}
                      value={rampDurationWeeks}
                      onChange={(e) => setRampDurationWeeks(Number(e.target.value))}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  You'll start at {rampStart} {unit}/week and reach {targetPerWeek} {unit}/week in {rampDurationWeeks} weeks.
                </p>
              </div>
            )}
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            variant="horizon" 
            className="w-full"
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? 'Creating...' : 'Create Goal'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
