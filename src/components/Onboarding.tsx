import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoalCategory } from '@/types/horizon';
import { Heart, Users, Dumbbell, Briefcase, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingProps {
  onComplete: () => void;
}

const priorityOptions: { id: GoalCategory; icon: typeof Heart; label: string; description: string }[] = [
  { id: 'relationship', icon: Heart, label: 'Relationship', description: 'Quality time with your partner' },
  { id: 'kids', icon: Users, label: 'Kids', description: 'Meaningful moments with children' },
  { id: 'health', icon: Dumbbell, label: 'Health', description: 'Physical and mental wellness' },
  { id: 'work', icon: Briefcase, label: 'Work', description: 'Career and productivity' },
  { id: 'self', icon: Sparkles, label: 'Self', description: 'Personal growth and hobbies' },
];

// Emotional onboarding screens
const emotionalScreens = [
  {
    id: 'recognition',
    headline: "You're holding a lot right now.",
    message: "The meetings, the meals, the bedtimes, the birthdays. The invisible weight of keeping everything running.",
    micro: "We see you.",
  },
  {
    id: 'connection',
    headline: "They won't be little forever.",
    message: "One day you'll look back and wonder where the time went. The first steps, the silly jokes, the quiet moments before bed.",
    micro: "These years are precious.",
  },
  {
    id: 'validation',
    headline: "You don't need to do more.",
    message: "You're not behind. You're not failing. You're a parent doing your best in a world that asks for everything.",
    micro: "Exhaustion isn't a character flaw.",
  },
  {
    id: 'hope',
    headline: "Balance isn't a myth.",
    message: "It's not about perfect days. It's about being present for the moments that matter—without the guilt.",
    micro: "Small shifts, big difference.",
  },
  {
    id: 'purpose',
    headline: "This is your quiet partner.",
    message: "Horizon helps you stay aligned with what matters most. Not by adding more to your plate—by helping you protect what's already there.",
    micro: "Less noise. More presence.",
  },
  {
    id: 'empowerment',
    headline: "You've got this.",
    message: "Let's build a life that feels less like survival and more like showing up—for them, and for yourself.",
    micro: "One intentional moment at a time.",
  },
  // Time perspective screens
  {
    id: 'weeks',
    headline: "In just a few weeks...",
    message: "Many parents notice 15–20 extra minutes each day. That's one more bedtime story. One calmer morning. One conversation without distractions.",
    micro: "Small moments, felt immediately.",
    timeframe: "Weeks",
  },
  {
    id: 'months',
    headline: "Over the coming months...",
    message: "Those daily moments add up. On average, 2–3 hours per week of uninterrupted family time. Evenings that feel protected. Weekends that feel like weekends again.",
    micro: "Routines that compound.",
    timeframe: "Months",
  },
  {
    id: 'years',
    headline: "Looking back years from now...",
    message: "Hundreds of hours reclaimed. Not for productivity—for presence. For the years that pass too quickly. For the memories they'll carry forever.",
    micro: "Time well spent.",
    timeframe: "Years",
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [phase, setPhase] = useState<'emotional' | 'setup'>('emotional');
  const [emotionalStep, setEmotionalStep] = useState(0);
  const [setupStep, setSetupStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    workStart: '09:00',
    workEnd: '18:00',
    priorities: [] as GoalCategory[],
  });

  const togglePriority = (id: GoalCategory) => {
    setFormData((prev) => ({
      ...prev,
      priorities: prev.priorities.includes(id)
        ? prev.priorities.filter((p) => p !== id)
        : [...prev.priorities, id],
    }));
  };

  const setupSteps = [
    // Name
    <div key="name" className="space-y-6 animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          What should we call you?
        </h2>
        <p className="text-muted-foreground">
          We&apos;ll use this to personalize your experience.
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            placeholder="e.g., Alex"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            className="h-12 text-lg"
          />
        </div>
      </div>
    </div>,

    // Location
    <div key="location" className="space-y-6 animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          Where are you based?
        </h2>
        <p className="text-muted-foreground">
          This helps us suggest local activities and experiences.
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="e.g., San Francisco"
            value={formData.city}
            onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
            className="h-12 text-lg"
          />
        </div>
      </div>
    </div>,

    // Work hours
    <div key="work" className="space-y-6 animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          What are your typical work hours?
        </h2>
        <p className="text-muted-foreground">
          We&apos;ll help you protect your non-work time.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="workStart">Start</Label>
          <Input
            id="workStart"
            type="time"
            value={formData.workStart}
            onChange={(e) => setFormData((prev) => ({ ...prev, workStart: e.target.value }))}
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="workEnd">End</Label>
          <Input
            id="workEnd"
            type="time"
            value={formData.workEnd}
            onChange={(e) => setFormData((prev) => ({ ...prev, workEnd: e.target.value }))}
            className="h-12"
          />
        </div>
      </div>
    </div>,

    // Priorities
    <div key="priorities" className="space-y-6 animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          What matters most to you?
        </h2>
        <p className="text-muted-foreground">
          Select the areas you want to focus on.
        </p>
      </div>
      <div className="space-y-3">
        {priorityOptions.map((option) => {
          const isSelected = formData.priorities.includes(option.id);
          const Icon = option.icon;
          
          return (
            <button
              key={option.id}
              onClick={() => togglePriority(option.id)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-smooth text-left",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-smooth",
                isSelected ? "bg-primary/10" : "bg-secondary"
              )}>
                <Icon className={cn(
                  "w-6 h-6 transition-smooth",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{option.label}</p>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
              <div className={cn(
                "w-6 h-6 rounded-full border-2 transition-smooth flex items-center justify-center",
                isSelected
                  ? "border-primary bg-primary"
                  : "border-border"
              )}>
                {isSelected && (
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>,

    // Ready
    <div key="ready" className="text-center space-y-6 animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
      <div className="w-24 h-24 mx-auto rounded-3xl bg-accent flex items-center justify-center">
        <svg className="w-12 h-12 text-accent-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="space-y-3">
        <h1 className="font-display text-3xl font-bold text-foreground">
          You&apos;re all set, {formData.name || 'friend'}!
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Horizon is ready to help you show up better for the people who matter most.
        </p>
      </div>
    </div>,
  ];

  const canProceedSetup = () => {
    switch (setupStep) {
      case 0: return formData.name.trim().length > 0;
      case 3: return formData.priorities.length > 0;
      default: return true;
    }
  };

  // Emotional Phase
  if (phase === 'emotional') {
    const currentScreen = emotionalScreens[emotionalStep];
    const isLastEmotional = emotionalStep === emotionalScreens.length - 1;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 gradient-sunrise opacity-60" />
        
        <div className="relative flex-1 flex flex-col items-center justify-center p-6">
          {/* Progress dots */}
          <div className="absolute top-8 left-0 right-0 flex justify-center gap-2">
            {emotionalScreens.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  i === emotionalStep 
                    ? "w-8 bg-primary" 
                    : i < emotionalStep 
                      ? "w-2 bg-primary/40" 
                      : "w-2 bg-border"
                )}
              />
            ))}
          </div>

          {/* Main content */}
          <div 
            key={currentScreen.id}
            className="w-full max-w-lg text-center space-y-8 animate-fade-in-up px-4"
            style={{ animationFillMode: 'forwards' }}
          >
            {/* Timeframe badge for time perspective screens */}
            {'timeframe' in currentScreen && currentScreen.timeframe && (
              <div className="flex justify-center">
                <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {currentScreen.timeframe}
                </span>
              </div>
            )}

            {/* Icon - only show for non-timeframe screens */}
            {!('timeframe' in currentScreen) && (
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full gradient-horizon flex items-center justify-center shadow-glow animate-pulse-gentle">
                  <Sparkles className="w-10 h-10 text-primary-foreground" />
                </div>
              </div>
            )}

            {/* Headline */}
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground leading-tight text-balance">
              {currentScreen.headline}
            </h1>

            {/* Message */}
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-md mx-auto text-balance">
              {currentScreen.message}
            </p>

            {/* Micro-copy */}
            <p className="text-sm text-primary font-medium tracking-wide uppercase">
              {currentScreen.micro}
            </p>
          </div>

          {/* Navigation */}
          <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-4 px-6">
            {emotionalStep > 0 && (
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setEmotionalStep(emotionalStep - 1)}
                className="text-muted-foreground"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            
            <Button
              variant="horizon"
              size="lg"
              onClick={() => {
                if (isLastEmotional) {
                  setPhase('setup');
                } else {
                  setEmotionalStep(emotionalStep + 1);
                }
              }}
              className="min-w-[140px] shadow-glow"
            >
              {isLastEmotional ? "Let's Begin" : "Continue"}
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>

          {/* Skip option */}
          {!isLastEmotional && (
            <button
              onClick={() => setPhase('setup')}
              className="absolute bottom-4 text-sm text-muted-foreground hover:text-foreground transition-smooth"
            >
              Skip intro
            </button>
          )}
        </div>
      </div>
    );
  }

  // Setup Phase
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {setupSteps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-smooth",
                i === setupStep ? "w-8 bg-primary" : i < setupStep ? "w-4 bg-primary/40" : "w-4 bg-border"
              )}
            />
          ))}
        </div>

        <Card className="p-8">
          {setupSteps[setupStep]}

          <div className="flex items-center justify-between mt-8">
            {setupStep > 0 ? (
              <Button
                variant="ghost"
                onClick={() => setSetupStep(setupStep - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => {
                  setPhase('emotional');
                  setEmotionalStep(emotionalScreens.length - 1);
                }}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
            )}

            {setupStep === setupSteps.length - 1 ? (
              <Button variant="horizon" size="lg" onClick={onComplete}>
                Get Started
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={() => setSetupStep(setupStep + 1)}
                disabled={!canProceedSetup()}
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
