import { useHorizon } from '@/contexts/HorizonContext';
import { Header, BottomNav } from '@/components/Navigation';
import { TimeCheck } from '@/components/TimeCheck';
import { WeeklyGoals } from '@/components/WeeklyGoals';
import { UpcomingDates, AIInsight } from '@/components/UpcomingDates';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export default function Dashboard() {
  const { user } = useHorizon();
  
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Greeting */}
        <section className="animate-fade-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <h2 className="font-display text-2xl font-semibold text-foreground mb-1">
            Good {getTimeOfDay()}, {user?.name}
          </h2>
          <p className="text-muted-foreground">
            Week of {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d')}
          </p>
        </section>

        {/* AI Insight */}
        <section>
          <AIInsight />
        </section>

        {/* Time Check - Key Emotional Hook */}
        <section>
          <TimeCheck />
        </section>

        {/* Weekly Goals */}
        <section>
          <WeeklyGoals />
        </section>

        {/* Upcoming Important Dates */}
        <section>
          <UpcomingDates />
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
