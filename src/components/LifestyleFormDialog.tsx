import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Heart, Users, Dumbbell, Briefcase, Sparkles, TrendingUp, Layers, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type GoalCategory = 'relationship' | 'kids' | 'health' | 'work' | 'self';

interface LifestyleGoal {
  id: string;
  name: string;
  category: GoalCategory;
  target_per_week: number;
  unit: 'sessions' | 'hours';
  enabled: boolean;
}

interface LifestyleTemplate {
  id: string;
  name: string;
  description: string;
  icon: typeof Heart;
  color: string;
  goals: Omit<LifestyleGoal, 'enabled'>[];
}

const categoryConfig: Record<GoalCategory, { icon: typeof Heart; label: string; color: string }> = {
  relationship: { icon: Heart, label: 'Relationship', color: 'text-primary' },
  kids: { icon: Users, label: 'Kids', color: 'text-highlight' },
  health: { icon: Dumbbell, label: 'Health', color: 'text-success' },
  work: { icon: Briefcase, label: 'Work', color: 'text-muted-foreground' },
  self: { icon: Sparkles, label: 'Self', color: 'text-primary' },
};

const lifestyleTemplates: LifestyleTemplate[] = [
  {
    id: 'balanced-family',
    name: 'Balanced Family Life',
    description: 'Quality time with loved ones while maintaining personal wellness',
    icon: Heart,
    color: 'from-primary to-highlight',
    goals: [
      { id: '1', name: 'Date nights', category: 'relationship', target_per_week: 2, unit: 'sessions' },
      { id: '2', name: 'Family activities', category: 'kids', target_per_week: 3, unit: 'sessions' },
      { id: '3', name: 'Exercise', category: 'health', target_per_week: 4, unit: 'sessions' },
      { id: '4', name: 'Personal hobby time', category: 'self', target_per_week: 2, unit: 'hours' },
    ],
  },
  {
    id: 'health-first',
    name: 'Health & Wellness Focus',
    description: 'Prioritize your physical and mental health',
    icon: Dumbbell,
    color: 'from-success to-highlight',
    goals: [
      { id: '1', name: 'Gym workouts', category: 'health', target_per_week: 5, unit: 'sessions' },
      { id: '2', name: 'Meditation', category: 'self', target_per_week: 7, unit: 'sessions' },
      { id: '3', name: 'Outdoor walks', category: 'health', target_per_week: 3, unit: 'sessions' },
      { id: '4', name: 'Quality sleep (8hrs)', category: 'health', target_per_week: 7, unit: 'sessions' },
    ],
  },
  {
    id: 'career-growth',
    name: 'Career Growth Mode',
    description: 'Advance your career while maintaining balance',
    icon: Briefcase,
    color: 'from-muted-foreground to-primary',
    goals: [
      { id: '1', name: 'Deep work sessions', category: 'work', target_per_week: 10, unit: 'hours' },
      { id: '2', name: 'Learning & development', category: 'work', target_per_week: 3, unit: 'hours' },
      { id: '3', name: 'Networking', category: 'work', target_per_week: 2, unit: 'sessions' },
      { id: '4', name: 'Exercise breaks', category: 'health', target_per_week: 3, unit: 'sessions' },
    ],
  },
  {
    id: 'new-parent',
    name: 'New Parent Balance',
    description: 'Navigate parenthood while staying connected',
    icon: Users,
    color: 'from-highlight to-primary',
    goals: [
      { id: '1', name: 'One-on-one kid time', category: 'kids', target_per_week: 5, unit: 'sessions' },
      { id: '2', name: 'Partner connection', category: 'relationship', target_per_week: 3, unit: 'sessions' },
      { id: '3', name: 'Self-care time', category: 'self', target_per_week: 2, unit: 'hours' },
      { id: '4', name: 'Family outings', category: 'kids', target_per_week: 2, unit: 'sessions' },
    ],
  },
  {
    id: 'custom',
    name: 'Custom Lifestyle',
    description: 'Build your own from scratch',
    icon: Sparkles,
    color: 'from-primary to-success',
    goals: [],
  },
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

interface LifestyleFormDialogProps {
  trigger: React.ReactNode;
  onSubmit: (data: GoalFormData) => Promise<void>;
}

export function LifestyleFormDialog({ trigger, onSubmit }: LifestyleFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'select' | 'customize' | 'ramping'>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<LifestyleTemplate | null>(null);
  const [goals, setGoals] = useState<LifestyleGoal[]>([]);
  const [rampEnabled, setRampEnabled] = useState(false);
  const [rampWeeks, setRampWeeks] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setStep('select');
    setSelectedTemplate(null);
    setGoals([]);
    setRampEnabled(false);
    setRampWeeks(4);
  };

  const handleSelectTemplate = (template: LifestyleTemplate) => {
    setSelectedTemplate(template);
    if (template.id === 'custom') {
      // Start with empty goals for custom
      setGoals([
        { id: crypto.randomUUID(), name: '', category: 'relationship', target_per_week: 3, unit: 'sessions', enabled: true },
      ]);
    } else {
      setGoals(template.goals.map(g => ({ ...g, enabled: true })));
    }
    setStep('customize');
  };

  const toggleGoal = (goalId: string) => {
    setGoals(prev => prev.map(g => 
      g.id === goalId ? { ...g, enabled: !g.enabled } : g
    ));
  };

  const updateGoal = (goalId: string, updates: Partial<LifestyleGoal>) => {
    setGoals(prev => prev.map(g => 
      g.id === goalId ? { ...g, ...updates } : g
    ));
  };

  const addCustomGoal = () => {
    setGoals(prev => [...prev, {
      id: crypto.randomUUID(),
      name: '',
      category: 'self',
      target_per_week: 3,
      unit: 'sessions',
      enabled: true,
    }]);
  };

  const removeGoal = (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  const handleSubmit = async () => {
    const enabledGoals = goals.filter(g => g.enabled && g.name.trim());
    if (enabledGoals.length === 0) return;

    setIsSubmitting(true);
    try {
      for (const goal of enabledGoals) {
        await onSubmit({
          name: goal.name.trim(),
          category: goal.category,
          target_per_week: goal.target_per_week,
          unit: goal.unit,
          ramp_enabled: rampEnabled,
          ramp_start: rampEnabled ? Math.max(1, Math.floor(goal.target_per_week * 0.3)) : null,
          ramp_duration_weeks: rampEnabled ? rampWeeks : null,
          ramp_current_week: rampEnabled ? 1 : null,
          icon: null,
        });
      }
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error('Error creating lifestyle goals:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const enabledCount = goals.filter(g => g.enabled && g.name.trim()).length;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            {step === 'select' && 'Create a Lifestyle'}
            {step === 'customize' && 'Customize Your Goals'}
            {step === 'ramping' && 'Set Your Pace'}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Select Template */}
        {step === 'select' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Choose a lifestyle template to get started, or build your own.
            </p>
            <div className="space-y-2">
              {lifestyleTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="w-full p-4 rounded-xl border-2 border-border hover:border-primary/50 transition-all text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
                        template.color
                      )}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {template.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                        {template.goals.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {template.goals.length} goals included
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Customize Goals */}
        {step === 'customize' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Toggle goals on/off and adjust targets to match your priorities.
            </p>

            <div className="space-y-3">
              {goals.map((goal) => {
                const config = categoryConfig[goal.category];
                const Icon = config.icon;
                return (
                  <div
                    key={goal.id}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all",
                      goal.enabled ? "border-primary/30 bg-accent/30" : "border-border opacity-60"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={goal.enabled}
                        onCheckedChange={() => toggleGoal(goal.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("w-4 h-4", config.color)} />
                          {selectedTemplate?.id === 'custom' ? (
                            <Input
                              value={goal.name}
                              onChange={(e) => updateGoal(goal.id, { name: e.target.value })}
                              placeholder="Goal name..."
                              className="h-8"
                            />
                          ) : (
                            <span className="font-medium text-foreground">{goal.name}</span>
                          )}
                        </div>
                        
                        {goal.enabled && (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={1}
                                max={20}
                                value={goal.target_per_week}
                                onChange={(e) => updateGoal(goal.id, { target_per_week: Number(e.target.value) })}
                                className="w-16 h-8"
                              />
                              <span className="text-sm text-muted-foreground">
                                {goal.unit}/week
                              </span>
                            </div>
                            
                            {selectedTemplate?.id === 'custom' && (
                              <select
                                value={goal.category}
                                onChange={(e) => updateGoal(goal.id, { category: e.target.value as GoalCategory })}
                                className="h-8 px-2 rounded-md border border-border bg-background text-sm"
                              >
                                <option value="relationship">Relationship</option>
                                <option value="kids">Kids</option>
                                <option value="health">Health</option>
                                <option value="work">Work</option>
                                <option value="self">Self</option>
                              </select>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {selectedTemplate?.id === 'custom' && goals.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGoal(goal.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedTemplate?.id === 'custom' && (
              <Button
                variant="outline"
                size="sm"
                onClick={addCustomGoal}
                className="w-full"
              >
                + Add Another Goal
              </Button>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep('select')}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                variant="horizon"
                onClick={() => setStep('ramping')}
                disabled={enabledCount === 0}
                className="flex-1"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Ramping Settings */}
        {step === 'ramping' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-accent/50 border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-highlight" />
                  <Label htmlFor="ramp-toggle" className="cursor-pointer font-medium">
                    Gradual Ramping
                  </Label>
                </div>
                <Switch
                  id="ramp-toggle"
                  checked={rampEnabled}
                  onCheckedChange={setRampEnabled}
                />
              </div>
              
              <p className="text-sm text-muted-foreground">
                Start at 30% of your targets and build up gradually. Recommended for sustainable habit building.
              </p>

              {rampEnabled && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="ramp-weeks">Ramp up over</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="ramp-weeks"
                      type="number"
                      min={2}
                      max={12}
                      value={rampWeeks}
                      onChange={(e) => setRampWeeks(Number(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">weeks</span>
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="p-4 rounded-xl border border-border space-y-2">
              <h4 className="font-medium text-foreground">Summary</h4>
              <p className="text-sm text-muted-foreground">
                Creating {enabledCount} goal{enabledCount !== 1 ? 's' : ''} for your{' '}
                <span className="text-primary font-medium">{selectedTemplate?.name}</span> lifestyle.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {goals.filter(g => g.enabled && g.name.trim()).map((goal) => {
                  const config = categoryConfig[goal.category];
                  const Icon = config.icon;
                  return (
                    <div
                      key={goal.id}
                      className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent text-xs"
                    >
                      <Icon className={cn("w-3 h-3", config.color)} />
                      <span>{goal.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep('customize')}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                variant="horizon"
                onClick={handleSubmit}
                disabled={isSubmitting || enabledCount === 0}
                className="flex-1"
              >
                {isSubmitting ? (
                  'Creating...'
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Create Lifestyle
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}