import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Calendar, Cake, Heart } from 'lucide-react';
import { DbPerson } from '@/hooks/useHorizonData';
import { format } from 'date-fns';

type RelationshipType = 'partner' | 'child' | 'parent' | 'sibling' | 'friend' | 'other';

interface ImportantDateInput {
  title: string;
  date: string;
  type: 'birthday' | 'anniversary' | 'custom';
}

interface PersonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person?: DbPerson | null;
  existingDates?: { title: string; date: string; type: string; id: string }[];
  onSave: (
    person: Omit<DbPerson, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    dates: ImportantDateInput[]
  ) => Promise<void>;
  onDelete?: (personId: string) => Promise<void>;
}

const relationshipOptions: { value: RelationshipType; label: string }[] = [
  { value: 'partner', label: 'Partner' },
  { value: 'child', label: 'Child' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'friend', label: 'Friend' },
  { value: 'other', label: 'Other' },
];

export function PersonFormDialog({ open, onOpenChange, person, existingDates, onSave, onDelete }: PersonFormDialogProps) {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType>('friend');
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Important dates
  const [birthday, setBirthday] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [customDates, setCustomDates] = useState<{ title: string; date: string }[]>([]);
  const [newCustomTitle, setNewCustomTitle] = useState('');
  const [newCustomDate, setNewCustomDate] = useState('');

  const isEditing = !!person;

  useEffect(() => {
    if (person) {
      setName(person.name);
      setRelationship(person.relationship as RelationshipType);
      setInterests(person.interests || []);
      setNotes(person.notes || '');
      setLocation(person.location || '');

      // Parse existing dates
      if (existingDates) {
        const bday = existingDates.find(d => d.type === 'birthday');
        const anniv = existingDates.find(d => d.type === 'anniversary');
        const customs = existingDates.filter(d => d.type === 'custom');
        
        setBirthday(bday?.date || '');
        setAnniversary(anniv?.date || '');
        setCustomDates(customs.map(c => ({ title: c.title, date: c.date })));
      } else {
        setBirthday('');
        setAnniversary('');
        setCustomDates([]);
      }
    } else {
      setName('');
      setRelationship('friend');
      setInterests([]);
      setNotes('');
      setLocation('');
      setBirthday('');
      setAnniversary('');
      setCustomDates([]);
    }
  }, [person, existingDates, open]);

  const handleAddInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const handleAddCustomDate = () => {
    if (newCustomTitle.trim() && newCustomDate) {
      setCustomDates([...customDates, { title: newCustomTitle.trim(), date: newCustomDate }]);
      setNewCustomTitle('');
      setNewCustomDate('');
    }
  };

  const handleRemoveCustomDate = (index: number) => {
    setCustomDates(customDates.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const dates: ImportantDateInput[] = [];
      
      if (birthday) {
        dates.push({ title: `${name}'s Birthday`, date: birthday, type: 'birthday' });
      }
      if (anniversary) {
        dates.push({ title: `Anniversary with ${name}`, date: anniversary, type: 'anniversary' });
      }
      customDates.forEach(cd => {
        dates.push({ title: cd.title, date: cd.date, type: 'custom' });
      });

      await onSave({
        name: name.trim(),
        relationship,
        interests: interests.length > 0 ? interests : null,
        notes: notes.trim() || null,
        location: location.trim() || null,
        avatar_url: person?.avatar_url || null,
        last_quality_time: person?.last_quality_time || null,
      }, dates);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving person:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!person || !onDelete) return;
    
    setIsLoading(true);
    try {
      await onDelete(person.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting person:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? 'Edit Person' : 'Add Person'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter their name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship">Relationship</Label>
            <Select value={relationship} onValueChange={(v) => setRelationship(v as RelationshipType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {relationshipOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Important Dates Section */}
          <div className="space-y-3 p-4 rounded-xl bg-accent/30 border border-border">
            <Label className="flex items-center gap-2 text-foreground font-medium">
              <Calendar className="w-4 h-4 text-primary" />
              Important Dates
            </Label>

            <div className="space-y-3">
              {/* Birthday */}
              <div className="flex items-center gap-2">
                <Cake className="w-4 h-4 text-highlight flex-shrink-0" />
                <Input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  placeholder="Birthday"
                  className="flex-1"
                />
                {birthday && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => setBirthday('')}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Anniversary (only for partner) */}
              {relationship === 'partner' && (
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary flex-shrink-0" />
                  <Input
                    type="date"
                    value={anniversary}
                    onChange={(e) => setAnniversary(e.target.value)}
                    placeholder="Anniversary"
                    className="flex-1"
                  />
                  {anniversary && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => setAnniversary('')}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}

              {/* Custom dates */}
              {customDates.map((cd, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 truncate">{cd.title}</span>
                  <span className="text-muted-foreground">{format(new Date(cd.date), 'MMM d')}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveCustomDate(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {/* Add custom date */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground">Add a custom date</p>
                <div className="flex gap-2">
                  <Input
                    value={newCustomTitle}
                    onChange={(e) => setNewCustomTitle(e.target.value)}
                    placeholder="Event name"
                    className="flex-1"
                  />
                  <Input
                    type="date"
                    value={newCustomDate}
                    onChange={(e) => setNewCustomDate(e.target.value)}
                    className="w-36"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddCustomDate}
                    disabled={!newCustomTitle.trim() || !newCustomDate}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Interests</Label>
            <div className="flex gap-2">
              <Input
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Add an interest"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInterest();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddInterest}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {interests.map(interest => (
                  <span
                    key={interest}
                    className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-full bg-accent text-accent-foreground"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => handleRemoveInterest(interest)}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or area"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Things to remember about them..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                Delete
              </Button>
            )}
            <div className="flex-1" />
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="horizon" disabled={isLoading || !name.trim()}>
              {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Person'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
