import { useHorizon } from '@/contexts/HorizonContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Gift, Heart, Sparkles } from 'lucide-react';
import { format, differenceInDays, addYears } from 'date-fns';

function getNextOccurrence(date: Date): Date {
  const now = new Date();
  const thisYear = new Date(now.getFullYear(), date.getMonth(), date.getDate());
  
  if (thisYear < now) {
    return addYears(thisYear, 1);
  }
  return thisYear;
}

export function UpcomingDates() {
  const { importantDates, people } = useHorizon();

  const upcomingWithPerson = importantDates
    .map((date) => {
      const person = people.find((p) => p.id === date.personId);
      const nextDate = date.isRecurring ? getNextOccurrence(date.date) : date.date;
      const daysUntil = differenceInDays(nextDate, new Date());
      
      return {
        ...date,
        person,
        nextDate,
        daysUntil,
      };
    })
    .filter((d) => d.daysUntil >= 0 && d.daysUntil <= 60)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  if (upcomingWithPerson.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Coming Up
        </h2>
        <Button variant="ghost" size="sm">
          <Calendar className="w-4 h-4" />
          View All
        </Button>
      </div>

      <div className="space-y-2">
        {upcomingWithPerson.slice(0, 3).map((item, index) => {
          const isUrgent = item.daysUntil <= 7;
          const isSoon = item.daysUntil <= 14;

          return (
            <Card
              key={item.id}
              className="p-4 flex items-center gap-4 animate-fade-in-up opacity-0"
              style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
            >
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center
                ${isUrgent ? 'bg-primary/10' : isSoon ? 'bg-highlight/10' : 'bg-secondary'}
              `}>
                {item.title.toLowerCase().includes('birthday') ? (
                  <Gift className={`w-6 h-6 ${isUrgent ? 'text-primary' : 'text-muted-foreground'}`} />
                ) : item.title.toLowerCase().includes('anniversary') ? (
                  <Heart className={`w-6 h-6 ${isUrgent ? 'text-primary' : 'text-muted-foreground'}`} />
                ) : (
                  <Calendar className={`w-6 h-6 ${isUrgent ? 'text-primary' : 'text-muted-foreground'}`} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {item.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {item.person?.name} • {format(item.nextDate, 'MMM d')}
                </p>
              </div>

              <div className="flex-shrink-0 text-right">
                <span className={`
                  inline-flex items-center text-sm font-medium px-3 py-1 rounded-full
                  ${isUrgent ? 'bg-primary/10 text-primary' : 
                    isSoon ? 'bg-highlight/10 text-highlight-foreground' : 
                    'bg-secondary text-muted-foreground'}
                `}>
                  {item.daysUntil === 0 ? 'Today' :
                   item.daysUntil === 1 ? 'Tomorrow' :
                   `${item.daysUntil} days`}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function AIInsight() {
  const { timeAwareness, user } = useHorizon();

  // Generate a contextual insight based on time awareness
  const urgentPerson = timeAwareness.find((t) => t.daysSinceLastActivity > 7);
  
  const insight = urgentPerson
    ? `It's been ${urgentPerson.daysSinceLastActivity} days since quality time with ${urgentPerson.personName}. Even 30 minutes of undivided attention can make a meaningful difference.`
    : `You're doing well staying connected this week, ${user?.name}. Keep nurturing these moments—they're what matter most.`;

  return (
    <Card className="p-6 gradient-card border-none animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl gradient-horizon flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground mb-1">
            Weekly Insight
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {insight}
          </p>
        </div>
      </div>
    </Card>
  );
}
