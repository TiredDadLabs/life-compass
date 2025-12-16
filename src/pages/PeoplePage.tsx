import { useHorizon } from '@/contexts/HorizonContext';
import { Header, BottomNav } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Users, UserCircle, Plus, MapPin, Gift, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Person, RelationshipType } from '@/types/horizon';

const relationshipConfig: Record<RelationshipType, { icon: typeof Heart; label: string; color: string }> = {
  partner: { icon: Heart, label: 'Partner', color: 'text-primary' },
  child: { icon: Users, label: 'Child', color: 'text-highlight' },
  parent: { icon: UserCircle, label: 'Parent', color: 'text-success' },
  sibling: { icon: Users, label: 'Sibling', color: 'text-muted-foreground' },
  friend: { icon: Users, label: 'Friend', color: 'text-primary' },
  other: { icon: UserCircle, label: 'Other', color: 'text-muted-foreground' },
};

interface PersonCardProps {
  person: Person;
  index: number;
}

function PersonCard({ person, index }: PersonCardProps) {
  const config = relationshipConfig[person.relationship];
  const Icon = config.icon;

  return (
    <Card
      className="p-5 animate-fade-in-up opacity-0 hover:shadow-glow cursor-pointer"
      style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-display font-semibold text-foreground">
            {person.name.charAt(0)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{person.name}</h3>
            <span className={cn(
              "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-secondary",
              config.color
            )}>
              <Icon className="w-3 h-3" />
              {config.label}
            </span>
          </div>

          {person.interests.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {person.interests.slice(0, 3).map((interest) => (
                <span
                  key={interest}
                  className="text-xs px-2 py-0.5 rounded-full bg-accent/50 text-accent-foreground"
                >
                  {interest}
                </span>
              ))}
              {person.interests.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{person.interests.length - 3} more
                </span>
              )}
            </div>
          )}

          {person.notes && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {person.notes}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
        <Button variant="ghost" size="sm" className="flex-1">
          <Gift className="w-4 h-4" />
          Gift Ideas
        </Button>
        <Button variant="ghost" size="sm" className="flex-1">
          <MessageSquare className="w-4 h-4" />
          Plan Time
        </Button>
      </div>
    </Card>
  );
}

export default function PeoplePage() {
  const { people } = useHorizon();

  // Group by relationship type
  const grouped = people.reduce((acc, person) => {
    const type = person.relationship;
    if (!acc[type]) acc[type] = [];
    acc[type].push(person);
    return acc;
  }, {} as Record<RelationshipType, Person[]>);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Your People
            </h2>
            <p className="text-muted-foreground">
              The ones who matter most
            </p>
          </div>
          <Button variant="horizon" size="sm">
            <Plus className="w-4 h-4" />
            Add Person
          </Button>
        </div>

        {Object.entries(grouped).map(([type, persons]) => (
          <section key={type} className="space-y-3">
            <h3 className="font-display font-medium text-foreground capitalize">
              {relationshipConfig[type as RelationshipType]?.label || type}
              {persons.length > 1 && 's'}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {persons.map((person, index) => (
                <PersonCard key={person.id} person={person} index={index} />
              ))}
            </div>
          </section>
        ))}
      </main>

      <BottomNav />
    </div>
  );
}
