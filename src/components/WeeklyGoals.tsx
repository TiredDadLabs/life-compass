import { useHorizon } from '@/contexts/HorizonContext';
import { Goal, GoalCategory } from '@/types/horizon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, Users, Dumbbell, Briefcase, Sparkles, Plus, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const categoryConfig: Record<GoalCategory, { icon: typeof Heart; label: string; color: string }> = {
  relationship: { icon: Heart, label: 'Relationship', color: 'text-primary' },
  kids: { icon: Users, label: 'Kids', color: 'text-highlight' },
  health: { icon: Dumbbell, label: 'Health', color: 'text-success' },
  work: { icon: Briefcase, label: 'Work', color: 'text-muted-foreground' },
  self: { icon: Sparkles, label: 'Self', color: 'text-primary' },
};

interface GoalCardProps {
  goal: Goal;
  index: number;
}

function GoalCard({ goal, index }: GoalCardProps) {
  const { updateGoalProgress, getCurrentRampedTarget } = useHorizon();
  const config = categoryConfig[goal.category];
  const Icon = config.icon;
  
  const target = getCurrentRampedTarget(goal);
  const progress = Math.min((goal.currentAmount / target) * 100, 100);
  const isComplete = goal.currentAmount >= target;

  return (
    <Card
      className={cn(
        "p-5 animate-fade-in-up opacity-0 hover:shadow-glow",
        isComplete && "ring-2 ring-success/30"
      )}
      style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            isComplete ? "bg-accent" : "bg-secondary"
          )}>
            <Icon className={cn("w-5 h-5", isComplete ? "text-accent-foreground" : config.color)} />
          </div>
          <div>
            <h3 className="font-medium text-foreground">{goal.name}</h3>
            <p className="text-sm text-muted-foreground">{config.label}</p>
          </div>
        </div>
        
        {goal.rampingEnabled && (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-highlight/10 text-highlight-foreground">
            <TrendingUp className="w-3 h-3" />
            Ramping
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-display font-semibold text-foreground">
            {goal.currentAmount}
            <span className="text-base text-muted-foreground font-sans"> / {target}</span>
          </span>
          <span className="text-sm text-muted-foreground">
            {goal.unit}
          </span>
        </div>

        <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
              isComplete ? "bg-success" : "gradient-horizon"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        {goal.rampingEnabled && goal.currentWeek && goal.rampWeeks && (
          <p className="text-xs text-muted-foreground">
            Week {goal.currentWeek} of {goal.rampWeeks} • Building up gradually
          </p>
        )}

        <Button
          variant={isComplete ? "success" : "secondary"}
          size="sm"
          className="w-full"
          onClick={() => updateGoalProgress(goal.id, 1)}
        >
          <Plus className="w-4 h-4" />
          {isComplete ? "Done for the week!" : `Log ${goal.unit === 'sessions' ? 'session' : 'hour'}`}
        </Button>
      </div>
    </Card>
  );
}

export function WeeklyGoals() {
  const { goals } = useHorizon();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">
          This Week&apos;s Goals
        </h2>
        <Button variant="ghost" size="sm">
          <Plus className="w-4 h-4" />
          Add Goal
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal, index) => (
          <GoalCard key={goal.id} goal={goal} index={index} />
        ))}
      </div>
    </div>
  );
}
