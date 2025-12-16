import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cake, Heart, Calendar, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays, parseISO, isBefore, addYears } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { DbImportantDate, DbPerson } from '@/hooks/useHorizonData';

interface UpcomingDatesProps {
  dates: DbImportantDate[];
  people: DbPerson[];
  userCity?: string;
}

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

const typeConfig = {
  birthday: { icon: Cake, label: 'Birthday', color: 'text-highlight' },
  anniversary: { icon: Heart, label: 'Anniversary', color: 'text-primary' },
  custom: { icon: Calendar, label: 'Event', color: 'text-muted-foreground' },
};

interface DateCardProps {
  date: DbImportantDate;
  person?: DbPerson;
  userCity?: string;
}

function DateCard({ date, person, userCity }: DateCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const config = typeConfig[date.type as keyof typeof typeConfig] || typeConfig.custom;
  const Icon = config.icon;
  const daysUntil = getDaysUntil(date.date);
  const nextOccurrence = getNextOccurrence(date.date);

  const getUrgencyBadge = () => {
    if (daysUntil === 0) return { text: 'Today!', class: 'bg-destructive text-destructive-foreground' };
    if (daysUntil === 1) return { text: 'Tomorrow', class: 'bg-highlight text-highlight-foreground' };
    if (daysUntil <= 7) return { text: `${daysUntil} days`, class: 'bg-primary/20 text-primary' };
    if (daysUntil <= 30) return { text: `${daysUntil} days`, class: 'bg-secondary text-secondary-foreground' };
    return null;
  };

  const urgency = getUrgencyBadge();

  const fetchRecommendations = async () => {
    if (recommendations || isLoading) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'celebration_ideas',
          person: person ? {
            name: person.name,
            relationship: person.relationship,
            interests: person.interests,
            notes: person.notes,
            location: person.location,
          } : undefined,
          importantDate: {
            title: date.title,
            date: format(nextOccurrence, 'MMMM d, yyyy'),
            type: date.type,
            person_name: date.person_name,
          },
          userCity,
          daysUntil,
        },
      });

      if (error) throw error;
      setRecommendations(data.content);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations('Unable to load recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpand = () => {
    if (!expanded) {
      fetchRecommendations();
    }
    setExpanded(!expanded);
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-secondary", config.color)}>
            <Icon className="w-5 h-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-foreground">{date.title}</h4>
              {urgency && (
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", urgency.class)}>
                  {urgency.text}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {format(nextOccurrence, 'EEEE, MMMM d')}
            </p>
          </div>

          <Button variant="ghost" size="sm" onClick={handleExpand}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-border">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Getting AI recommendations...</span>
              </div>
            ) : recommendations ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI Recommendations
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-muted-foreground whitespace-pre-wrap">
                  {recommendations}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Card>
  );
}

export function UpcomingDates({ dates, people, userCity }: UpcomingDatesProps) {
  // Sort dates by days until next occurrence
  const sortedDates = [...dates].sort((a, b) => getDaysUntil(a.date) - getDaysUntil(b.date));
  
  // Filter to show dates within 60 days
  const upcomingDates = sortedDates.filter(d => getDaysUntil(d.date) <= 60);

  if (upcomingDates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="font-display font-medium text-foreground">Upcoming Dates</h3>
      </div>
      
      <div className="space-y-3">
        {upcomingDates.map((date) => {
          const person = people.find(p => p.id === date.person_id);
          return (
            <DateCard
              key={date.id}
              date={date}
              person={person}
              userCity={userCity}
            />
          );
        })}
      </div>
    </div>
  );
}
