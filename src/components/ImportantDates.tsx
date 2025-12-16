import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Gift, Heart, Cake, Star, Plus, Sparkles, X } from 'lucide-react';
import { format, differenceInDays, parseISO, addYears } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface ImportantDate {
  id: string;
  title: string;
  date: string;
  type: 'birthday' | 'anniversary' | 'holiday' | 'other';
  person_id?: string;
  person_name?: string;
  is_recurring: boolean;
}

interface Person {
  id: string;
  name: string;
  relationship: string;
  interests?: string[];
}

interface ImportantDatesProps {
  dates: ImportantDate[];
  people: Person[];
  onDateAdded: () => void;
  onGetGiftIdeas: (date: ImportantDate, person?: Person) => void;
}

const typeIcons = {
  birthday: Cake,
  anniversary: Heart,
  holiday: Star,
  other: Calendar,
};

const typeColors = {
  birthday: 'text-pink-500 bg-pink-500/10',
  anniversary: 'text-rose-500 bg-rose-500/10',
  holiday: 'text-amber-500 bg-amber-500/10',
  other: 'text-primary bg-primary/10',
};

function getNextOccurrence(dateStr: string): Date {
  const date = parseISO(dateStr);
  const today = new Date();
  const thisYear = new Date(today.getFullYear(), date.getMonth(), date.getDate());
  
  if (thisYear < today) {
    return addYears(thisYear, 1);
  }
  return thisYear;
}

function getDaysUntil(dateStr: string): number {
  const nextDate = getNextOccurrence(dateStr);
  return differenceInDays(nextDate, new Date());
}

export function ImportantDates({ dates, people, onDateAdded, onGetGiftIdeas }: ImportantDatesProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date: '',
    type: 'birthday' as const,
    person_id: '',
  });

  // Sort by days until next occurrence
  const sortedDates = [...dates].sort((a, b) => getDaysUntil(a.date) - getDaysUntil(b.date));
  const upcomingDates = sortedDates.slice(0, 5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('important_dates').insert({
        user_id: user.id,
        title: form.title,
        date: form.date,
        type: form.type,
        person_id: form.person_id || null,
        is_recurring: true,
      });

      if (error) throw error;

      toast.success('Important date added!');
      setForm({ title: '', date: '', type: 'birthday', person_id: '' });
      setIsOpen(false);
      onDateAdded();
    } catch (error) {
      console.error('Error adding date:', error);
      toast.error('Failed to add date');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('important_dates').delete().eq('id', id);
      if (error) throw error;
      toast.success('Date removed');
      onDateAdded();
    } catch (error) {
      console.error('Error deleting date:', error);
      toast.error('Failed to remove date');
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Important Dates
        </h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Add Important Date</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">What's the occasion?</Label>
                <Input
                  id="title"
                  placeholder="e.g., Sarah's Birthday"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="anniversary">Anniversary</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {people.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="person">Link to person (optional)</Label>
                  <Select value={form.person_id} onValueChange={(v) => setForm({ ...form, person_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a person" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {people.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button type="submit" variant="horizon" className="w-full" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Date'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {upcomingDates.length === 0 ? (
        <Card className="p-6 text-center">
          <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">
            No important dates yet. Add birthdays, anniversaries, and more!
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {upcomingDates.map((date) => {
            const daysUntil = getDaysUntil(date.date);
            const Icon = typeIcons[date.type];
            const colorClass = typeColors[date.type];
            const linkedPerson = people.find(p => p.id === date.person_id);
            const isUrgent = daysUntil <= 7;
            const nextDate = getNextOccurrence(date.date);

            return (
              <Card 
                key={date.id} 
                className={`p-4 transition-all ${isUrgent ? 'border-primary/30 bg-primary/5' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground truncate">{date.title}</h3>
                      {isUrgent && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                          Soon!
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(nextDate, 'MMM d')} • {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {(date.type === 'birthday' || date.type === 'anniversary') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onGetGiftIdeas(date, linkedPerson || undefined)}
                      >
                        <Sparkles className="w-4 h-4 text-primary" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(date.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
