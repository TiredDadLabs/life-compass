import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, MapPin, Clock, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DbPerson } from '@/hooks/useHorizonData';

interface ActivityIdeasProps {
  person: DbPerson;
  userCity?: string;
}

export function ActivityIdeas({ person, userCity }: ActivityIdeasProps) {
  const [ideas, setIdeas] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: person.relationship === 'partner' ? 'date_ideas' : 'activity_ideas',
          person: {
            name: person.name,
            relationship: person.relationship,
            interests: person.interests,
            notes: person.notes,
            location: person.location,
          },
          userCity: userCity || person.location,
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      
      setIdeas(data.content);
    } catch (err) {
      console.error('Error fetching activity ideas:', err);
      setError(err instanceof Error ? err.message : 'Failed to get ideas');
    } finally {
      setIsLoading(false);
    }
  };

  if (!ideas && !isLoading && !error) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={fetchIdeas}
        className="w-full"
      >
        <Sparkles className="w-4 h-4 mr-2 text-primary" />
        Get {person.relationship === 'partner' ? 'Date' : 'Activity'} Ideas
        {userCity && (
          <span className="ml-2 text-xs text-muted-foreground flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            {userCity}
          </span>
        )}
      </Button>
    );
  }

  return (
    <Card className="p-4 bg-accent/30 border-accent">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">
            {person.relationship === 'partner' ? 'Date' : 'Activity'} Ideas for {person.name}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchIdeas}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Generating ideas...</span>
        </div>
      )}

      {error && (
        <div className="text-sm text-destructive py-4">
          {error}
          <Button variant="link" size="sm" onClick={fetchIdeas} className="ml-2">
            Try again
          </Button>
        </div>
      )}

      {ideas && !isLoading && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
            {ideas}
          </div>
        </div>
      )}

      {userCity && (
        <div className="mt-3 pt-3 border-t border-border flex items-center text-xs text-muted-foreground">
          <MapPin className="w-3 h-3 mr-1" />
          Based on {userCity}
        </div>
      )}
    </Card>
  );
}
