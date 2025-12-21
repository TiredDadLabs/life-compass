import { useState } from 'react';
import { useHorizonData, DbPerson } from '@/hooks/useHorizonData';
import { Header, BottomNav } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Users, UserCircle, Plus, Sparkles, Edit, Calendar, Cake, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PersonFormDialog } from '@/components/PersonFormDialog';
import { ActivityIdeas } from '@/components/ActivityIdeas';
import { GiftIdeas } from '@/components/GiftIdeas';
import { UpcomingDates } from '@/components/UpcomingDates';
import { RelationshipHealthSignals } from '@/components/relationships';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, differenceInDays, isBefore, addYears } from 'date-fns';

type RelationshipType = 'partner' | 'child' | 'parent' | 'sibling' | 'friend' | 'other';

const relationshipConfig: Record<RelationshipType, { icon: typeof Heart; label: string; color: string }> = {
  partner: { icon: Heart, label: 'Partner', color: 'text-primary' },
  child: { icon: Users, label: 'Child', color: 'text-highlight' },
  parent: { icon: UserCircle, label: 'Parent', color: 'text-success' },
  sibling: { icon: Users, label: 'Sibling', color: 'text-muted-foreground' },
  friend: { icon: Users, label: 'Friend', color: 'text-primary' },
  other: { icon: UserCircle, label: 'Other', color: 'text-muted-foreground' },
};

function getNextOccurrence(dateStr: string): Date {
  const date = parseISO(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let nextDate = new Date(today.getFullYear(), date.getMonth(), date.getDate());
  if (isBefore(nextDate, today)) {
    nextDate = addYears(nextDate, 1);
  }
  return nextDate;
}

function getDaysUntil(dateStr: string): number {
  const nextOccurrence = getNextOccurrence(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return differenceInDays(nextOccurrence, today);
}

interface PersonCardProps {
  person: DbPerson;
  index: number;
  userCity?: string;
  personDates: { title: string; date: string; type: string; id: string }[];
  onEdit: (person: DbPerson) => void;
}

function PersonCard({ person, index, userCity, personDates, onEdit }: PersonCardProps) {
  const [showIdeas, setShowIdeas] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  
  // Check if it's a standard relationship type or custom
  const standardTypes: RelationshipType[] = ['partner', 'child', 'parent', 'sibling', 'friend', 'other'];
  const isStandardType = standardTypes.includes(person.relationship as RelationshipType);
  const config = isStandardType 
    ? relationshipConfig[person.relationship as RelationshipType] 
    : relationshipConfig.other;
  const displayLabel = isStandardType ? config.label : person.relationship;
  const Icon = config.icon;

  // Get nearest upcoming date
  const upcomingDate = personDates
    .map(d => ({ ...d, daysUntil: getDaysUntil(d.date) }))
    .sort((a, b) => a.daysUntil - b.daysUntil)[0];

  return (
    <Card
      className="p-5 animate-fade-in-up opacity-0 hover:shadow-glow"
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
              {displayLabel}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8"
              onClick={() => onEdit(person)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>

          {/* Upcoming date badge */}
          {upcomingDate && upcomingDate.daysUntil <= 30 && (
            <div className="flex items-center gap-1.5 mb-2">
              {upcomingDate.type === 'birthday' ? (
                <Cake className="w-3.5 h-3.5 text-highlight" />
              ) : (
                <Calendar className="w-3.5 h-3.5 text-primary" />
              )}
              <span className="text-xs text-muted-foreground">
                {upcomingDate.title} in {upcomingDate.daysUntil} days
              </span>
            </div>
          )}

          {person.interests && person.interests.length > 0 && (
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
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={() => { setShowGifts(!showGifts); setShowIdeas(false); }}
        >
          <Gift className="w-4 h-4" />
          Gifts
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={() => { setShowIdeas(!showIdeas); setShowGifts(false); }}
        >
          <Sparkles className="w-4 h-4" />
          {person.relationship === 'partner' ? 'Dates' : 'Activities'}
        </Button>
      </div>

      {showGifts && (
        <div className="mt-4">
          <GiftIdeas person={person} />
        </div>
      )}

      {showIdeas && (
        <div className="mt-4">
          <ActivityIdeas person={person} userCity={userCity} />
        </div>
      )}
    </Card>
  );
}

export default function PeoplePage() {
  const { people, profile, importantDates, addPerson, updatePerson, deletePerson, getPersonDates } = useHorizonData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<DbPerson | null>(null);
  const { toast } = useToast();

  const handleAddPerson = () => {
    setEditingPerson(null);
    setDialogOpen(true);
  };

  const handleEditPerson = (person: DbPerson) => {
    setEditingPerson(person);
    setDialogOpen(true);
  };

  const handleSavePerson = async (
    personData: Omit<DbPerson, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    dates: { title: string; date: string; type: string }[]
  ) => {
    try {
      if (editingPerson) {
        await updatePerson(editingPerson.id, personData, dates);
        toast({ title: 'Person updated', description: `${personData.name} has been updated.` });
      } else {
        await addPerson(personData, dates);
        toast({ title: 'Person added', description: `${personData.name} has been added.` });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save person.', variant: 'destructive' });
      throw error;
    }
  };

  const handleDeletePerson = async (personId: string) => {
    try {
      await deletePerson(personId);
      toast({ title: 'Person removed', description: 'The person has been removed.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove person.', variant: 'destructive' });
      throw error;
    }
  };

  // Group by relationship type (custom relationships go under 'other')
  const standardTypes: RelationshipType[] = ['partner', 'child', 'parent', 'sibling', 'friend', 'other'];
  const grouped = people.reduce((acc, person) => {
    const type = standardTypes.includes(person.relationship as RelationshipType) 
      ? person.relationship as RelationshipType 
      : 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(person);
    return acc;
  }, {} as Record<RelationshipType, DbPerson[]>);

  const relationshipOrder: RelationshipType[] = ['partner', 'child', 'parent', 'sibling', 'friend', 'other'];

  // Get editing person's dates
  const editingPersonDates = editingPerson
    ? getPersonDates(editingPerson.id).map(d => ({ id: d.id, title: d.title, date: d.date, type: d.type }))
    : [];

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
          <Button variant="horizon" size="sm" onClick={handleAddPerson}>
            <Plus className="w-4 h-4" />
            Add Person
          </Button>
        </div>

        {/* Relationship Health Signals */}
        <RelationshipHealthSignals />

        {/* Upcoming Dates Section */}
        {importantDates.length > 0 && (
          <UpcomingDates 
            dates={importantDates} 
            people={people} 
            userCity={profile?.city || undefined} 
          />
        )}

        {people.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground mb-2">No people added yet</h3>
            <p className="text-muted-foreground mb-4">
              Add the important people in your life to get personalized activity ideas.
            </p>
            <Button variant="horizon" onClick={handleAddPerson}>
              <Plus className="w-4 h-4" />
              Add Your First Person
            </Button>
          </Card>
        ) : (
          relationshipOrder.map((type) => {
            const persons = grouped[type];
            if (!persons || persons.length === 0) return null;

            return (
              <section key={type} className="space-y-3">
                <h3 className="font-display font-medium text-foreground capitalize">
                  {relationshipConfig[type]?.label || type}
                  {persons.length > 1 && 's'}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {persons.map((person, index) => (
                    <PersonCard
                      key={person.id}
                      person={person}
                      index={index}
                      userCity={profile?.city || undefined}
                      personDates={getPersonDates(person.id).map(d => ({ id: d.id, title: d.title, date: d.date, type: d.type }))}
                      onEdit={handleEditPerson}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </main>

      <PersonFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        person={editingPerson}
        existingDates={editingPersonDates}
        onSave={handleSavePerson}
        onDelete={editingPerson ? handleDeletePerson : undefined}
      />

      <BottomNav />
    </div>
  );
}
