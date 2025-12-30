import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useHorizonData } from '@/hooks/useHorizonData';
import { Header, BottomNav } from '@/components/Navigation';
import { TimeCheck } from '@/components/TimeCheck';
import { WeeklyGoals } from '@/components/WeeklyGoals';
import { ImportantDates } from '@/components/ImportantDates';
import { AIInsights } from '@/components/AIInsights';
import { TodoList } from '@/components/TodoList';
import { TaskAgent } from '@/components/TaskAgent';
import { ScreenTimeCard, ShutdownMode, RestPermission } from '@/components/screentime';
import { SmartNudges, LifeDriftDetection, BalanceScore } from '@/components/awareness';
// QuickMoodCheckin removed from home screen - available on Self Care page
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user: authUser } = useAuth();
  const { profile, people, importantDates, isLoading, fetchImportantDates, fetchPeople } = useHorizonData();
  
  const [giftDialog, setGiftDialog] = useState<{
    isOpen: boolean;
    content: string | null;
    loading: boolean;
  }>({ isOpen: false, content: null, loading: false });
  
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const userName = profile?.name || authUser?.email?.split('@')[0] || 'there';

  const handleGetGiftIdeas = async (date: any, person?: any) => {
    setGiftDialog({ isOpen: true, content: null, loading: true });
    
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
            name: date.title.replace("'s Birthday", "").replace(" Birthday", ""),
            relationship: 'loved one',
          },
          importantDate: {
            title: date.title,
            date: date.date,
            type: date.type,
          },
          daysUntil: daysUntil > 0 ? daysUntil : 0,
          userCity: profile?.city,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      setGiftDialog({ isOpen: true, content: data.content, loading: false });
    } catch (error) {
      console.error('Error getting gift ideas:', error);
      toast.error('Failed to get gift ideas. Please try again.');
      setGiftDialog({ isOpen: false, content: null, loading: false });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your horizon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Greeting */}
        <section className="animate-fade-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <h2 className="font-display text-2xl font-semibold text-foreground mb-1">
            Good {getTimeOfDay()}, {userName}
          </h2>
          <p className="text-muted-foreground">
            Week of {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d')}
          </p>
        </section>

        {/* Rest Permission - Evening nudge */}
        <section>
          <RestPermission />
        </section>

        {/* Smart Nudges - Pattern-based awareness */}
        <section>
          <SmartNudges />
        </section>

        {/* Life Drift Detection */}
        <section>
          <LifeDriftDetection />
        </section>

        {/* Balance Score */}
        <section>
          <BalanceScore />
        </section>

        {/* AI Insights */}
        <section className="space-y-4">
          <AIInsights 
            people={people.map(p => ({
              id: p.id,
              name: p.name,
              relationship: p.relationship,
              interests: p.interests || undefined,
              notes: p.notes || undefined,
              location: p.location || undefined,
            }))}
            upcomingDates={importantDates.map(d => ({
              id: d.id,
              title: d.title,
              date: d.date,
              type: d.type,
              person_id: d.person_id || undefined,
              person_name: d.person_name,
            }))}
            userCity={profile?.city || undefined}
          />
        </section>

        {/* Time Check - Key Emotional Hook */}
        <section>
          <TimeCheck />
        </section>

        {/* Quick Capture & To-Do List */}
        <section className="space-y-4">
          <TaskAgent />
          <TodoList />
        </section>

        {/* Weekly Goals */}
        <section>
          <WeeklyGoals />
        </section>

        {/* Screen Time Awareness */}
        <section className="grid gap-4 sm:grid-cols-2">
          <ScreenTimeCard />
          <ShutdownMode />
        </section>

        {/* Important Dates */}
        <section>
          <ImportantDates
            dates={importantDates.map(d => ({
              id: d.id,
              title: d.title,
              date: d.date,
              type: d.type as any,
              person_id: d.person_id || undefined,
              person_name: d.person_name,
              is_recurring: d.is_recurring,
            }))}
            people={people.map(p => ({
              id: p.id,
              name: p.name,
              relationship: p.relationship,
              interests: p.interests || undefined,
            }))}
            onDateAdded={() => {
              fetchImportantDates();
            }}
            onGetGiftIdeas={handleGetGiftIdeas}
          />
        </section>
      </main>

      <BottomNav />

      {/* Gift Ideas Dialog */}
      <Dialog open={giftDialog.isOpen} onOpenChange={(open) => !open && setGiftDialog({ isOpen: false, content: null, loading: false })}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Gift Ideas
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {giftDialog.loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Thinking...</span>
              </div>
            ) : giftDialog.content ? (
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {giftDialog.content}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
