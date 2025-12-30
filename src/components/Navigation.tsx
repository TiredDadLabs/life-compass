import { Link, useLocation } from 'react-router-dom';
import { Home, Target, Users, Heart, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/todos', icon: CheckSquare, label: 'Tasks' },
  { to: '/self-care', icon: Heart, label: 'Self-Care' },
  { to: '/people', icon: Users, label: 'People' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-pb">
      <div className="max-w-lg mx-auto px-2">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-smooth",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "relative p-2 rounded-xl transition-smooth",
                  isActive && "bg-primary/10"
                )}>
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Horizon
            </h1>
            <p className="text-sm text-muted-foreground">
              Your weekly command center
            </p>
          </div>
          <div className="w-10 h-10 rounded-full gradient-horizon flex items-center justify-center text-primary-foreground font-semibold">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
