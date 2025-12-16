import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Loader2, RefreshCw, ExternalLink, ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DbPerson } from '@/hooks/useHorizonData';

interface GiftIdeasProps {
  person: DbPerson;
  occasion?: string;
}

interface GiftSuggestion {
  name: string;
  description: string;
  priceRange: string;
  searchUrl: string;
  category: string;
}

function parseGiftSuggestions(content: string): GiftSuggestion[] {
  const gifts: GiftSuggestion[] = [];
  
  // Try to parse structured gift data from the AI response
  const giftRegex = /\*\*(.+?)\*\*\s*[-–]\s*(.+?)(?:\n|$)/g;
  let match;
  
  while ((match = giftRegex.exec(content)) !== null) {
    const name = match[1].trim();
    const description = match[2].trim();
    
    // Determine price range from description
    let priceRange = '$$';
    if (description.includes('$$$') || description.toLowerCase().includes('premium') || description.toLowerCase().includes('luxury')) {
      priceRange = '$$$';
    } else if (description.includes('$') && !description.includes('$$')) {
      priceRange = '$';
    }
    
    // Generate search URL for Amazon
    const searchQuery = encodeURIComponent(name);
    
    gifts.push({
      name,
      description,
      priceRange,
      searchUrl: `https://www.amazon.com/s?k=${searchQuery}`,
      category: 'general',
    });
  }
  
  return gifts;
}

export function GiftIdeas({ person, occasion }: GiftIdeasProps) {
  const [ideas, setIdeas] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'gift_suggestions',
          person: {
            name: person.name,
            relationship: person.relationship,
            interests: person.interests,
            notes: person.notes,
            location: person.location,
          },
          occasion: occasion || 'general gift',
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      
      setIdeas(data.content);
    } catch (err) {
      console.error('Error fetching gift ideas:', err);
      setError(err instanceof Error ? err.message : 'Failed to get gift ideas');
    } finally {
      setIsLoading(false);
    }
  };

  // Parse ideas into structured gifts for rendering with links
  const renderGiftWithLinks = (content: string) => {
    // Split by numbered items or bullet points
    const lines = content.split('\n');
    
    return lines.map((line, index) => {
      // Check if line contains a gift name (usually bold or numbered)
      const boldMatch = line.match(/\*\*(.+?)\*\*/);
      const giftName = boldMatch ? boldMatch[1] : null;
      
      if (giftName) {
        const searchQuery = encodeURIComponent(giftName);
        const amazonUrl = `https://www.amazon.com/s?k=${searchQuery}`;
        const etsyUrl = `https://www.etsy.com/search?q=${searchQuery}`;
        
        // Replace the bold text with a linked version
        const linkedLine = line.replace(
          /\*\*(.+?)\*\*/,
          `**$1**`
        );
        
        return (
          <div key={index} className="mb-4">
            <div className="whitespace-pre-wrap">{linkedLine.replace(/\*\*/g, '')}</div>
            <div className="flex gap-2 mt-2">
              <a
                href={amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-[#FF9900]/10 text-[#FF9900] hover:bg-[#FF9900]/20 transition-colors"
              >
                <ShoppingBag className="w-3 h-3" />
                Amazon
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={etsyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-[#F1641E]/10 text-[#F1641E] hover:bg-[#F1641E]/20 transition-colors"
              >
                <ShoppingBag className="w-3 h-3" />
                Etsy
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        );
      }
      
      // Regular line without gift name
      if (line.trim()) {
        return <div key={index} className="whitespace-pre-wrap mb-1">{line}</div>;
      }
      return null;
    });
  };

  if (!ideas && !isLoading && !error) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={fetchIdeas}
        className="w-full"
      >
        <Gift className="w-4 h-4 mr-2 text-highlight" />
        Get Gift Ideas for {person.name}
      </Button>
    );
  }

  return (
    <Card className="p-4 bg-highlight/5 border-highlight/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-highlight" />
          <span className="font-medium text-sm">Gift Ideas for {person.name}</span>
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
          <Loader2 className="w-6 h-6 animate-spin text-highlight" />
          <span className="ml-2 text-sm text-muted-foreground">Finding perfect gifts...</span>
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
        <div className="text-sm text-foreground leading-relaxed">
          {renderGiftWithLinks(ideas)}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
        Click shop links to browse real products based on these suggestions
      </div>
    </Card>
  );
}
