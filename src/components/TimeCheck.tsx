import { useHorizon } from '@/contexts/HorizonContext';
import { TimeAwareness } from '@/types/horizon';
import { Heart, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const relationshipIcons = {
  partner: Heart,
  child: Users,
  parent: Users,
  sibling: Users,
  friend: Users,
  other: Users,
};

interface TimeCheckCardProps {
  awareness: TimeAwareness;
  index: number;
}

function TimeCheckCard({ awareness, index }: TimeCheckCardProps) {
  const Icon = relationshipIcons[awareness.relationship];
  const isUrgent = awareness.daysSinceLastActivity > 7;
  const isWarning = awareness.daysSinceLastActivity > 3 && awareness.daysSinceLastActivity <= 7;

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl transition-smooth animate-fade-in-up opacity-0",
        isUrgent ? "bg-gentle-alert" : isWarning ? "bg-highlight/10" : "bg-secondary"
      )}
      style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
    >
      <div
        className={cn(
          "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
          isUrgent ? "bg-gentle-alert-foreground/10" : "bg-primary/10"
        )}
      >
        <Icon className={cn(
          "w-6 h-6",
          isUrgent ? "text-gentle-alert-foreground" : "text-primary"
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">
          {awareness.personName}
        </p>
        <p className={cn(
          "text-sm",
          isUrgent ? "text-gentle-alert-foreground" : "text-muted-foreground"
        )}>
          {awareness.daysSinceLastActivity === 0 ? (
            "Connected today"
          ) : awareness.daysSinceLastActivity === 1 ? (
            "1 day ago"
          ) : (
            `${awareness.daysSinceLastActivity} days since quality time`
          )}
        </p>
      </div>

      <div className="flex-shrink-0">
        <span className={cn(
          "inline-flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full",
          isUrgent ? "bg-gentle-alert-foreground/10 text-gentle-alert-foreground" :
          isWarning ? "bg-highlight/20 text-highlight-foreground" :
          "bg-accent text-accent-foreground"
        )}>
          <Clock className="w-3 h-3" />
          {awareness.daysSinceLastActivity}d
        </span>
      </div>
    </div>
  );
}

export function TimeCheck() {
  const { timeAwareness } = useHorizon();

  // Sort by days since last activity (most urgent first)
  const sorted = [...timeAwareness].sort(
    (a, b) => b.daysSinceLastActivity - a.daysSinceLastActivity
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Time Check
        </h2>
        <span className="text-sm text-muted-foreground">
          Who needs your presence?
        </span>
      </div>
      
      <div className="space-y-2">
        {sorted.map((awareness, index) => (
          <TimeCheckCard
            key={awareness.personId}
            awareness={awareness}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
