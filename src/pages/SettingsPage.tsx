import { useHorizon } from '@/contexts/HorizonContext';
import { Header, BottomNav } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  User, Bell, Calendar, Shield, CreditCard, HelpCircle, 
  LogOut, ChevronRight, Moon, Sun 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsItemProps {
  icon: typeof User;
  label: string;
  description?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
}

function SettingsItem({ icon: Icon, label, description, onClick, trailing }: SettingsItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary transition-smooth text-left"
    >
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {trailing || <ChevronRight className="w-5 h-5 text-muted-foreground" />}
    </button>
  );
}

export default function SettingsPage() {
  const { user } = useHorizon();

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile card */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl gradient-horizon flex items-center justify-center text-primary-foreground text-2xl font-display font-semibold">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl font-semibold text-foreground">
                {user?.name}
              </h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {user?.city} • {user?.timezone}
              </p>
            </div>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </div>
        </Card>

        {/* Settings sections */}
        <section className="space-y-2">
          <h3 className="font-display font-medium text-foreground px-2">
            Preferences
          </h3>
          <Card className="divide-y divide-border">
            <SettingsItem
              icon={Bell}
              label="Notifications"
              description="Reminders and updates"
            />
            <SettingsItem
              icon={Calendar}
              label="Calendar Integration"
              description="Connect Google Calendar"
            />
            <SettingsItem
              icon={Moon}
              label="Appearance"
              description="Light mode"
              trailing={
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
                  <Sun className="w-4 h-4 text-highlight" />
                  <span className="text-sm font-medium text-foreground">Light</span>
                </div>
              }
            />
          </Card>
        </section>

        <section className="space-y-2">
          <h3 className="font-display font-medium text-foreground px-2">
            Account
          </h3>
          <Card className="divide-y divide-border">
            <SettingsItem
              icon={Shield}
              label="Privacy & Security"
              description="Data and permissions"
            />
            <SettingsItem
              icon={CreditCard}
              label="Subscription"
              description="Manage your plan"
            />
            <SettingsItem
              icon={HelpCircle}
              label="Help & Support"
              description="FAQs and contact"
            />
          </Card>
        </section>

        <section className="space-y-2">
          <Card>
            <SettingsItem
              icon={LogOut}
              label="Sign Out"
              trailing={null}
            />
          </Card>
        </section>

        {/* App info */}
        <div className="text-center py-6">
          <p className="font-display text-lg font-semibold text-foreground">
            Horizon
          </p>
          <p className="text-sm text-muted-foreground">
            Version 1.0.0 • Made with ♡ for families
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
