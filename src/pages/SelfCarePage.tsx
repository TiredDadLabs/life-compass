import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header, BottomNav } from '@/components/Navigation';
import { ExerciseSection } from '@/components/selfcare/ExerciseSection';
import { NutritionSection } from '@/components/selfcare/NutritionSection';
import { DowntimeSection } from '@/components/selfcare/DowntimeSection';
import { MoodCheckinSection } from '@/components/selfcare/MoodCheckinSection';
import { RitualsSection } from '@/components/selfcare/RitualsSection';
import { WeeklySummary } from '@/components/selfcare/WeeklySummary';
import { ContextualRestReminder } from '@/components/emotional';
import { BalanceScore } from '@/components/awareness';
import { Dumbbell, Apple, Moon, Heart, Sparkles, BarChart3, Scale } from 'lucide-react';

export default function SelfCarePage() {
  const [activeTab, setActiveTab] = useState('summary');

  const tabs = [
    { value: 'summary', label: 'Summary', icon: BarChart3 },
    { value: 'balance', label: 'Balance', icon: Scale },
    { value: 'exercise', label: 'Exercise', icon: Dumbbell },
    { value: 'nutrition', label: 'Nutrition', icon: Apple },
    { value: 'downtime', label: 'Rest', icon: Moon },
    { value: 'mood', label: 'Check-In', icon: Heart },
    { value: 'rituals', label: 'Rituals', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 pb-24 pt-4 space-y-6">
        {/* Late night encouragement */}
        <ContextualRestReminder page="selfcare" />

        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground mb-1">
            Self-Care
          </h2>
          <p className="text-muted-foreground text-sm">
            Consistency, awareness, and permission to rest
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex overflow-x-auto gap-1 bg-secondary/50 p-1 rounded-xl mb-6">
            {tabs.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex-1 min-w-fit flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-soft rounded-lg transition-smooth"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="summary" className="animate-fade-in-up">
            <WeeklySummary />
          </TabsContent>

          <TabsContent value="balance" className="animate-fade-in-up">
            <BalanceScore />
          </TabsContent>

          <TabsContent value="exercise" className="animate-fade-in-up">
            <ExerciseSection />
          </TabsContent>

          <TabsContent value="nutrition" className="animate-fade-in-up">
            <NutritionSection />
          </TabsContent>

          <TabsContent value="downtime" className="animate-fade-in-up">
            <DowntimeSection />
          </TabsContent>

          <TabsContent value="mood" className="animate-fade-in-up">
            <MoodCheckinSection />
          </TabsContent>

          <TabsContent value="rituals" className="animate-fade-in-up">
            <RitualsSection />
          </TabsContent>
        </Tabs>
      </main>
      <BottomNav />
    </div>
  );
}
