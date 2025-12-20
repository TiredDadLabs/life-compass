import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Leaf, Coffee, Moon, Sun } from 'lucide-react';

const timeBasedMessages: Record<string, { icon: React.ReactNode; messages: { text: string; subtext: string }[] }> = {
  morning: {
    icon: <Sun className="w-5 h-5 text-amber-400" />,
    messages: [
      { text: "Start gently today.", subtext: "You don't have to hit the ground running." },
      { text: "Morning energy is precious.", subtext: "Use it on what matters most to you." },
      { text: "What would make today feel meaningful?", subtext: "Not productive. Meaningful." },
    ],
  },
  afternoon: {
    icon: <Coffee className="w-5 h-5 text-amber-600" />,
    messages: [
      { text: "Midday pause.", subtext: "Even 5 minutes of stillness counts." },
      { text: "You're doing enough.", subtext: "Progress isn't always visible." },
      { text: "Check in with yourself.", subtext: "How are you really feeling right now?" },
    ],
  },
  evening: {
    icon: <Moon className="w-5 h-5 text-indigo-400" />,
    messages: [
      { text: "The day is winding down.", subtext: "Let your mind follow." },
      { text: "You did what you could today.", subtext: "That's always enough." },
      { text: "Evening is for presence, not productivity.", subtext: "Be with the people you love." },
    ],
  },
};

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

interface RestSignalProps {
  context?: 'dashboard' | 'goals' | 'todo';
  className?: string;
}

export function RestSignal({ context = 'dashboard', className = '' }: RestSignalProps) {
  const timeOfDay = getTimeOfDay();
  const { icon, messages } = timeBasedMessages[timeOfDay];
  
  // Pick a message based on context + some randomness
  const messageIndex = Math.floor(Math.random() * messages.length);
  const message = messages[messageIndex];

  // Context-specific additions
  const contextMessages: Record<string, { text: string; subtext: string } | null> = {
    goals: timeOfDay === 'evening' 
      ? { text: "Goals can wait until tomorrow.", subtext: "Rest is part of the journey." }
      : null,
    todo: timeOfDay === 'evening'
      ? { text: "Not everything needs to be done today.", subtext: "Let some tasks breathe." }
      : null,
    dashboard: null,
  };

  const finalMessage = contextMessages[context] || message;

  return (
    <Card className={`bg-gradient-to-r from-violet-950/20 to-indigo-950/20 border-violet-800/20 ${className}`}>
      <CardContent className="py-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
            <span className="truncate">{finalMessage.text}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            {finalMessage.subtext}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ContextualRestReminder({ page }: { page: 'goals' | 'todos' | 'selfcare' }) {
  const hour = new Date().getHours();
  
  // Only show in late evening
  if (hour < 20) return null;

  const reminders: Record<string, { text: string; subtext: string }> = {
    goals: { 
      text: "Late night goal-checking?", 
      subtext: "Your progress is safe. Come back with fresh eyes tomorrow." 
    },
    todos: { 
      text: "The list will be here tomorrow.", 
      subtext: "Rest makes you more effective, not less." 
    },
    selfcare: { 
      text: "You're taking care of yourself.", 
      subtext: "That's the most important thing you can do right now." 
    },
  };

  const reminder = reminders[page];

  return (
    <Card className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border-slate-700/30">
      <CardContent className="py-3 flex items-center gap-3">
        <Leaf className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{reminder.text}</p>
          <p className="text-xs text-muted-foreground">{reminder.subtext}</p>
        </div>
      </CardContent>
    </Card>
  );
}
