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

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
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

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="text-center space-y-6 animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
      <div className="w-24 h-24 mx-auto rounded-3xl gradient-horizon flex items-center justify-center shadow-glow">
        <Sparkles className="w-12 h-12 text-primary-foreground" />
      </div>
      <div className="space-y-3">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Welcome to Horizon
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          When you look back on your life, will you remember how much you worked—or how much time you spent with the people you love?
        </p>
      </div>
      <p className="text-muted-foreground">
        Let&apos;s set up your personal life compass.
      </p>
    </div>,

    // Step 1: Name
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

    // Step 2: Location
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

    // Step 3: Work hours
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

    // Step 4: Priorities
    <div key="priorities" className="space-y-6 animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          What matters most to you?
        </h2>
        <p className="text-muted-foreground">
          Select the areas you want to focus on. You can always change these later.
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

    // Step 5: Ready
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

  const canProceed = () => {
    switch (step) {
      case 1: return formData.name.trim().length > 0;
      case 4: return formData.priorities.length > 0;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-smooth",
                i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/40" : "w-4 bg-border"
              )}
            />
          ))}
        </div>

        <Card className="p-8">
          {steps[step]}

          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <Button
                variant="ghost"
                onClick={() => setStep(step - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step === steps.length - 1 ? (
              <Button variant="horizon" size="lg" onClick={onComplete}>
                Get Started
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant={step === 0 ? "horizon" : "default"}
                size={step === 0 ? "lg" : "default"}
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                {step === 0 ? "Let's Begin" : "Continue"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
