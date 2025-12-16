import { useHorizonData, DbGoal } from '@/hooks/useHorizonData';
import { Header, BottomNav } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Users, Dumbbell, Briefcase, Sparkles, Plus, TrendingUp, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WeekOverWeekTracker } from '@/components/WeekOverWeekTracker';
import { useToast } from '@/hooks/use-toast';
import { GoalFormDialog } from '@/components/GoalFormDialog';

type GoalCategory = 'relationship' | 'kids' | 'health' | 'work' | 'self';

const categoryConfig: Record<GoalCategory, { icon: typeof Heart; label: string; color: string; bgColor: string }> = {
  relationship: { icon: Heart, label: 'Relationship', color: 'text-primary', bgColor: 'bg-primary/10' },
  kids: { icon: Users, label: 'Kids', color: 'text-highlight', bgColor: 'bg-highlight/10' },
  health: { icon: Dumbbell, label: 'Health', color: 'text-success', bgColor: 'bg-success/10' },
  work: { icon: Briefcase, label: 'Work', color: 'text-muted-foreground', bgColor: 'bg-muted' },
  self: { icon: Sparkles, label: 'Self', color: 'text-primary', bgColor: 'bg-primary/10' },
};

interface GoalDetailCardProps {
  goal: DbGoal;
  index: number;
  onLogProgress: (goalId: string) => Promise<void>;
  getCurrentRampedTarget: (goal: DbGoal) => number;
}

function GoalDetailCard({ goal, index, onLogProgress, getCurrentRampedTarget }: GoalDetailCardProps) {
  const config = categoryConfig[goal.category as GoalCategory] || categoryConfig.self;
  const Icon = config.icon;
  
  const target = getCurrentRampedTarget(goal);
  const progress = Math.min((goal.current_progress / target) * 100, 100);
  const isComplete = goal.current_progress >= target;

  return (
    <Card
      className={cn(
        "p-5 animate-fade-in-up opacity-0",
        isComplete && "ring-2 ring-success/30 bg-accent/20"
      )}
      style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", config.bgColor)}>
            <Icon className={cn("w-6 h-6", config.color)} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{goal.name}</h3>
            <p className="text-sm text-muted-foreground">{config.label}</p>
          </div>
        </div>
        
        {isComplete && (
          <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
            <Check className="w-5 h-5 text-success-foreground" />
          </div>
        )}
      </div>

      {/* Progress visualization */}
      <div className="space-y-4">
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-display font-bold text-foreground">
              {goal.current_progress}
              <span className="text-lg text-muted-foreground font-sans font-normal"> / {target}</span>
            </span>
            <span className="text-sm text-muted-foreground">
              {goal.unit}
            </span>
          </div>

          <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all duration-700",
                isComplete ? "bg-success" : "gradient-horizon"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Ramping info */}
        {goal.ramp_enabled && goal.ramp_current_week && goal.ramp_duration_weeks && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-highlight/10">
            <TrendingUp className="w-4 h-4 text-highlight" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Building up gradually
              </p>
              <p className="text-xs text-muted-foreground">
                Week {goal.ramp_current_week} of {goal.ramp_duration_weeks} • Started at {goal.ramp_start} {goal.unit}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant={isComplete ? "success" : "horizon"}
            className="flex-1"
            onClick={() => onLogProgress(goal.id)}
          >
            <Plus className="w-4 h-4" />
            Log {goal.unit === 'sessions' ? 'Session' : 'Hour'}
          </Button>
          <Button variant="outline" size="icon">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function GoalsPage() {
  const { goals, logGoalActivity, getCurrentRampedTarget, addGoal } = useHorizonData();
  const { toast } = useToast();

  const handleLogProgress = async (goalId: string) => {
    try {
      await logGoalActivity(goalId);
      toast({ title: 'Progress logged!', description: 'Keep up the great work!' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to log progress.', variant: 'destructive' });
    }
  };

  const handleAddGoal = async (goalData: Parameters<typeof addGoal>[0]) => {
    try {
      await addGoal(goalData);
      toast({ title: 'Goal created!', description: 'Start tracking your progress.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create goal.', variant: 'destructive' });
      throw error;
    }
  };

  // Group by category
  const grouped = goals.reduce((acc, goal) => {
    const category = goal.category as GoalCategory;
    if (!acc[category]) acc[category] = [];
    acc[category].push(goal);
    return acc;
  }, {} as Record<GoalCategory, DbGoal[]>);

  const categoryOrder: GoalCategory[] = ['relationship', 'kids', 'health', 'work', 'self'];

  const completedCount = goals.filter((g) => g.current_progress >= getCurrentRampedTarget(g)).length;
  const inProgressCount = goals.filter((g) => g.current_progress > 0 && g.current_progress < getCurrentRampedTarget(g)).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Weekly Goals
            </h2>
            <p className="text-muted-foreground">
              What matters to you this week
            </p>
          </div>
          <GoalFormDialog
            trigger={
              <Button variant="horizon" size="sm">
                <Plus className="w-4 h-4" />
                New Goal
              </Button>
            }
            onSubmit={handleAddGoal}
          />
        </div>

        {/* Progress summary */}
        <Card className="p-5 gradient-card border-none">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-display font-bold text-foreground">
                {completedCount}
              </p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-foreground">
                {inProgressCount}
              </p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-primary">
                {goals.length}
              </p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </Card>

        {/* Week over Week Tracker */}
        {goals.length > 0 && (
          <WeekOverWeekTracker
            goals={goals.map(g => ({
              id: g.id,
              name: g.name,
              category: g.category,
              target_per_week: g.target_per_week,
              unit: g.unit,
            }))}
          />
        )}

        {/* Goals by category */}
        {categoryOrder.map((category) => {
          const categoryGoals = grouped[category];
          if (!categoryGoals || categoryGoals.length === 0) return null;

          const config = categoryConfig[category];

          return (
            <section key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <config.icon className={cn("w-5 h-5", config.color)} />
                <h3 className="font-display font-medium text-foreground">
                  {config.label}
                </h3>
              </div>
              <div className="space-y-4">
                {categoryGoals.map((goal, index) => (
                  <GoalDetailCard
                    key={goal.id}
                    goal={goal}
                    index={index}
                    onLogProgress={handleLogProgress}
                    getCurrentRampedTarget={getCurrentRampedTarget}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {goals.length === 0 && (
          <Card className="p-8 text-center">
            <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground mb-2">No goals set yet</h3>
            <p className="text-muted-foreground mb-4">
              Set weekly goals to track what matters most to you.
            </p>
            <GoalFormDialog
              trigger={
                <Button variant="horizon">
                  <Plus className="w-4 h-4" />
                  Create Your First Goal
                </Button>
              }
              onSubmit={handleAddGoal}
            />
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
