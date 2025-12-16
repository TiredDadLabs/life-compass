import { Header, BottomNav } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Perk } from '@/types/horizon';
import { Dumbbell, Utensils, Gamepad2, Sparkles, TreePine, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const categoryIcons = {
  fitness: Dumbbell,
  dining: Utensils,
  kids: Gamepad2,
  wellness: Sparkles,
  experiences: TreePine,
};

// Static perks data for MVP
const demoPerks: Perk[] = [
  {
    id: '1',
    title: 'Equinox Family Membership',
    description: 'Premium fitness for the whole family with childcare included.',
    category: 'fitness',
    discount: '20% off first 3 months',
    link: '#',
  },
  {
    id: '2',
    title: 'Date Night Dining',
    description: 'Curated romantic restaurants with priority reservations.',
    category: 'dining',
    discount: 'Complimentary dessert',
    link: '#',
  },
  {
    id: '3',
    title: 'KidZania Adventures',
    description: 'Interactive city for kids to explore and learn through play.',
    category: 'kids',
    discount: '15% off weekend passes',
    link: '#',
  },
  {
    id: '4',
    title: 'Calm Premium',
    description: 'Meditation and sleep stories for busy parents.',
    category: 'wellness',
    discount: '30% annual discount',
    link: '#',
  },
  {
    id: '5',
    title: 'Family Hiking Club',
    description: 'Guided family-friendly hikes in your local area.',
    category: 'experiences',
    discount: 'First hike free',
    link: '#',
  },
  {
    id: '6',
    title: 'HelloFresh Family Plan',
    description: 'Easy meal kits designed for families with kids.',
    category: 'dining',
    discount: '50% off first box',
    link: '#',
  },
];

interface PerkCardProps {
  perk: Perk;
  index: number;
}

function PerkCard({ perk, index }: PerkCardProps) {
  const Icon = categoryIcons[perk.category];

  return (
    <Card
      className="p-5 animate-fade-in-up opacity-0 hover:shadow-glow cursor-pointer group"
      style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-smooth">
          <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-smooth" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-smooth">
            {perk.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {perk.description}
          </p>
          
          {perk.discount && (
            <span className="inline-flex items-center text-sm font-medium px-3 py-1 rounded-full bg-accent text-accent-foreground">
              {perk.discount}
            </span>
          )}
        </div>

        <Button variant="ghost" size="icon" className="flex-shrink-0">
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}

export default function PerksPage() {
  // Group by category
  const grouped = demoPerks.reduce((acc, perk) => {
    if (!acc[perk.category]) acc[perk.category] = [];
    acc[perk.category].push(perk);
    return acc;
  }, {} as Record<string, Perk[]>);

  const categoryLabels: Record<string, string> = {
    fitness: 'Fitness & Health',
    dining: 'Dining',
    kids: 'Kids Activities',
    wellness: 'Wellness',
    experiences: 'Experiences',
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Perks & Offers
          </h2>
          <p className="text-muted-foreground">
            Exclusive deals for Horizon families
          </p>
        </div>

        {/* Featured perk */}
        <Card className="p-6 gradient-horizon text-primary-foreground border-none">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                Featured
              </span>
              <h3 className="font-display text-xl font-semibold mt-1 mb-2">
                Family Wellness Bundle
              </h3>
              <p className="text-sm opacity-90 mb-4">
                Gym membership, meal planning, and family activities—all in one package.
              </p>
              <Button variant="secondary" size="sm">
                Learn More
              </Button>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8" />
            </div>
          </div>
        </Card>

        {/* Perks by category */}
        {Object.entries(grouped).map(([category, perks]) => (
          <section key={category} className="space-y-3">
            <h3 className="font-display font-medium text-foreground">
              {categoryLabels[category] || category}
            </h3>
            <div className="space-y-3">
              {perks.map((perk, index) => (
                <PerkCard key={perk.id} perk={perk} index={index} />
              ))}
            </div>
          </section>
        ))}
      </main>

      <BottomNav />
    </div>
  );
}
