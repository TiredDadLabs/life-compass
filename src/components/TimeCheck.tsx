import { useState, useEffect } from 'react';
import { Heart, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { differenceInDays } from 'date-fns';

type RelationshipType = 'partner' | 'child' | 'parent' | 'sibling' | 'friend' | 'other';

interface Person {
  id: string;
  name: string;
  relationship: RelationshipType;
  last_quality_time: string | null;
}

interface TimeAwareness {
  personId: string;
  personName: string;
  relationship: RelationshipType;
  daysSinceLastActivity: number;
}

const relationshipIcons: Record<RelationshipType, typeof Heart> = {
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
          ) : awareness.daysSinceLastActivity === -1 ? (
            "No quality time logged yet"
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
          {awareness.daysSinceLastActivity >= 0 ? `${awareness.daysSinceLastActivity}d` : '—'}
        </span>
      </div>
    </div>
  );
}

export function TimeCheck() {
  const { user } = useAuth();
  const [timeAwareness, setTimeAwareness] = useState<TimeAwareness[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPeople();
    }
  }, [user]);

  const fetchPeople = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('people')
        .select('id, name, relationship, last_quality_time')
        .eq('user_id', user.id)
        .order('last_quality_time', { ascending: true, nullsFirst: true });

      if (error) throw error;

      if (data) {
        const awareness: TimeAwareness[] = data.map((person) => {
          const daysSince = person.last_quality_time
            ? differenceInDays(new Date(), new Date(person.last_quality_time))
            : -1; // -1 indicates no quality time logged

          return {
            personId: person.id,
            personName: person.name,
            relationship: person.relationship as RelationshipType,
            daysSinceLastActivity: daysSince,
          };
        });

        // Sort: people without quality time first, then by days since (most urgent first)
        awareness.sort((a, b) => {
          if (a.daysSinceLastActivity === -1 && b.daysSinceLastActivity !== -1) return -1;
          if (b.daysSinceLastActivity === -1 && a.daysSinceLastActivity !== -1) return 1;
          return b.daysSinceLastActivity - a.daysSinceLastActivity;
        });

        setTimeAwareness(awareness);
      }
    } catch (error) {
      console.error('Error fetching people:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Time Check
          </h2>
        </div>
        <div className="p-4 rounded-xl bg-secondary animate-pulse h-20" />
      </div>
    );
  }

  if (timeAwareness.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Time Check
          </h2>
        </div>
        <div className="p-6 rounded-xl bg-secondary/50 text-center">
          <Users className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            Add people in the People section to track quality time
          </p>
        </div>
      </div>
    );
  }

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
        {timeAwareness.slice(0, 5).map((awareness, index) => (
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
