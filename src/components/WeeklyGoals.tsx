import { useHorizonData, DbGoal } from '@/hooks/useHorizonData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, Users, Dumbbell, Briefcase, Sparkles, Plus, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

type GoalCategory = 'relationship' | 'kids' | 'health' | 'work' | 'self';

const categoryConfig: Record<GoalCategory, { icon: typeof Heart; label: string; color: string }> = {
  relationship: { icon: Heart, label: 'Relationship', color: 'text-primary' },
  kids: { icon: Users, label: 'Kids', color: 'text-highlight' },
  health: { icon: Dumbbell, label: 'Health', color: 'text-success' },
  work: { icon: Briefcase, label: 'Work', color: 'text-muted-foreground' },
  self: { icon: Sparkles, label: 'Self', color: 'text-primary' },
};

interface GoalCardProps {
  goal: DbGoal;
  index: number;
  onLogProgress: (goalId: string) => void;
  getCurrentRampedTarget: (goal: DbGoal) => number;
}

function GoalCard({ goal, index, onLogProgress, getCurrentRampedTarget }: GoalCardProps) {
  const category = goal.category as GoalCategory;
  const config = categoryConfig[category] || categoryConfig.self;
  const Icon = config.icon;
  
  const target = getCurrentRampedTarget(goal);
  const progress = Math.min((goal.current_progress / target) * 100, 100);
  const isComplete = goal.current_progress >= target;

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
        
        {goal.ramp_enabled && (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-highlight/10 text-highlight-foreground">
            <TrendingUp className="w-3 h-3" />
            Ramping
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-display font-semibold text-foreground">
            {goal.current_progress}
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

        {goal.ramp_enabled && goal.ramp_current_week && goal.ramp_duration_weeks && (
          <p className="text-xs text-muted-foreground">
            Week {goal.ramp_current_week} of {goal.ramp_duration_weeks} • Building up gradually
          </p>
        )}

        <Button
          variant={isComplete ? "success" : "secondary"}
          size="sm"
          className="w-full"
          onClick={() => onLogProgress(goal.id)}
        >
          <Plus className="w-4 h-4" />
          {isComplete ? "Done for the week!" : `Log ${goal.unit === 'sessions' ? 'session' : 'hour'}`}
        </Button>
      </div>
    </Card>
  );
}

export function WeeklyGoals() {
  const { goals, logGoalActivity, getCurrentRampedTarget, isLoading } = useHorizonData();

  const handleLogProgress = async (goalId: string) => {
    try {
      await logGoalActivity(goalId);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            This Week&apos;s Goals
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-24 bg-secondary rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">
          This Week&apos;s Goals
        </h2>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/goals">
            <Plus className="w-4 h-4" />
            Add Goal
          </Link>
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No goals yet. Start by adding your first goal!</p>
          <Button asChild>
            <Link to="/goals">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Goal
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal, index) => (
            <GoalCard 
              key={goal.id} 
              goal={goal} 
              index={index}
              onLogProgress={handleLogProgress}
              getCurrentRampedTarget={getCurrentRampedTarget}
            />
          ))}
        </div>
      )}
    </div>
  );
}
