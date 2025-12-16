import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, RefreshCw, Gift, Heart, MapPin, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Person {
  id: string;
  name: string;
  relationship: string;
  interests?: string[];
  notes?: string;
  location?: string;
}

interface ImportantDate {
  id: string;
  title: string;
  date: string;
  type: string;
  person_id?: string;
  person_name?: string;
}

interface AIInsightsProps {
  people: Person[];
  upcomingDates: ImportantDate[];
  userCity?: string;
}

export function AIInsights({ people, upcomingDates, userCity }: AIInsightsProps) {
  const [weeklySummary, setWeeklySummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [giftDialog, setGiftDialog] = useState<{
    isOpen: boolean;
    content: string | null;
    loading: boolean;
    date?: ImportantDate;
    person?: Person;
  }>({ isOpen: false, content: null, loading: false });

  const fetchWeeklySummary = async () => {
    if (people.length === 0) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'weekly_summary',
          people: people.map(p => ({
            name: p.name,
            relationship: p.relationship,
            interests: p.interests,
          })),
          upcomingDates: upcomingDates.slice(0, 5).map(d => ({
            title: d.title,
            date: d.date,
            type: d.type,
            person_name: d.person_name,
          })),
          userCity,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      setWeeklySummary(data.content);
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
      // Don't show toast for initial load failures
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (people.length > 0) {
      fetchWeeklySummary();
    }
  }, [people.length]);

  const getGiftIdeas = async (date: ImportantDate, person?: Person) => {
    setGiftDialog({ isOpen: true, content: null, loading: true, date, person });
    
    try {
      const daysUntil = Math.ceil(
        (new Date(date.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'gift_ideas',
          person: person ? {
            name: person.name,
            relationship: person.relationship,
            interests: person.interests,
            notes: person.notes,
            location: person.location,
          } : {
            name: date.title.replace("'s Birthday", "").replace("'s Anniversary", ""),
            relationship: 'loved one',
          },
          importantDate: {
            title: date.title,
            date: date.date,
            type: date.type,
          },
          daysUntil: daysUntil > 0 ? daysUntil : 0,
          userCity,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      setGiftDialog(prev => ({ ...prev, content: data.content, loading: false }));
    } catch (error) {
      console.error('Error getting gift ideas:', error);
      toast.error('Failed to get gift ideas. Please try again.');
      setGiftDialog(prev => ({ ...prev, loading: false, isOpen: false }));
    }
  };

  const getDateIdeas = async (person: Person) => {
    setGiftDialog({ isOpen: true, content: null, loading: true, person });
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: person.relationship === 'child' ? 'activity_ideas' : 'date_ideas',
          person: {
            name: person.name,
            relationship: person.relationship,
            interests: person.interests,
            notes: person.notes,
            location: person.location,
          },
          userCity,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      setGiftDialog(prev => ({ ...prev, content: data.content, loading: false }));
    } catch (error) {
      console.error('Error getting date ideas:', error);
      toast.error('Failed to get ideas. Please try again.');
      setGiftDialog(prev => ({ ...prev, loading: false, isOpen: false }));
    }
  };

  return (
    <>
      <Card className="p-5 gradient-horizon text-primary-foreground">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-semibold">Your Week</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                onClick={fetchWeeklySummary}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            {isLoading ? (
              <p className="text-sm text-primary-foreground/80">
                Thinking about your week...
              </p>
            ) : weeklySummary ? (
              <p className="text-sm text-primary-foreground/90 leading-relaxed">
                {weeklySummary}
              </p>
            ) : (
              <p className="text-sm text-primary-foreground/80">
                Add people to your circle to get personalized insights.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Quick Actions for People */}
      {people.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {people.slice(0, 4).map((person) => (
            <Button
              key={person.id}
              variant="outline"
              size="sm"
              className="flex-shrink-0 gap-2"
              onClick={() => getDateIdeas(person)}
            >
              {person.relationship === 'spouse' ? (
                <Heart className="w-3 h-3 text-rose-500" />
              ) : person.relationship === 'child' ? (
                <MapPin className="w-3 h-3 text-primary" />
              ) : (
                <Gift className="w-3 h-3 text-primary" />
              )}
              Ideas for {person.name}
            </Button>
          ))}
        </div>
      )}

      {/* AI Dialog */}
      <Dialog open={giftDialog.isOpen} onOpenChange={(open) => !open && setGiftDialog(prev => ({ ...prev, isOpen: false }))}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {giftDialog.date ? 'Gift Ideas' : giftDialog.person?.relationship === 'child' ? 'Activity Ideas' : 'Date Ideas'}
              {giftDialog.person && ` for ${giftDialog.person.name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {giftDialog.loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Thinking...</span>
              </div>
            ) : giftDialog.content ? (
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {giftDialog.content}
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export type { Person as AIInsightsPerson, ImportantDate as AIInsightsImportantDate };
