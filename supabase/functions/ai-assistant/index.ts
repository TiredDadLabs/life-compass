import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Person {
  name: string;
  relationship: string;
  interests?: string[];
  notes?: string;
  location?: string;
}

interface ImportantDate {
  title: string;
  date: string;
  type: string;
  person_name?: string;
}

interface RequestBody {
  type: 'gift_ideas' | 'gift_suggestions' | 'date_ideas' | 'activity_ideas' | 'weekly_summary' | 'reminder' | 'celebration_ideas';
  person?: Person;
  importantDate?: ImportantDate;
  upcomingDates?: ImportantDate[];
  people?: Person[];
  userCity?: string;
  daysUntil?: number;
  occasion?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const body: RequestBody = await req.json();
    const { type, person, importantDate, upcomingDates, people, userCity, daysUntil } = body;

    let systemPrompt = `You are Horizon, a warm and thoughtful AI life assistant for busy parents. 
You help them prioritize meaningful time with loved ones. 
Your tone is supportive, calm, and action-oriented. Never be preachy or guilt-inducing.
Keep responses concise and practical. Focus on experiences over material things when possible.`;

    let userPrompt = "";

    switch (type) {
      case 'gift_ideas':
        if (!person || !importantDate) {
          throw new Error("Person and importantDate required for gift_ideas");
        }
        userPrompt = `Generate 5 thoughtful gift ideas for ${person.name} (${person.relationship}).
${person.interests?.length ? `Their interests include: ${person.interests.join(', ')}.` : ''}
${person.notes ? `Additional notes: ${person.notes}` : ''}
The occasion is: ${importantDate.title} on ${importantDate.date}.
${daysUntil !== undefined ? `There are ${daysUntil} days until this date.` : ''}

For each gift, provide:
- Name of the gift
- Why it's meaningful for this person
- Approximate price range ($, $$, or $$$)

Focus on thoughtful, personal gifts that show you know this person.`;
        break;

      case 'gift_suggestions':
        if (!person) {
          throw new Error("Person required for gift_suggestions");
        }
        const occasion = body.occasion || 'a thoughtful gift';
        userPrompt = `Generate 5 specific, purchasable gift ideas for ${person.name} (${person.relationship}).

${person.interests?.length ? `Their interests include: ${person.interests.join(', ')}.` : ''}
${person.notes ? `Additional context: ${person.notes}` : ''}
Occasion: ${occasion}

IMPORTANT: Suggest REAL, SPECIFIC products that can be found on major retailers like Amazon or Etsy.
Be specific with product names (e.g., "Ember Temperature Control Smart Mug 2" not just "smart mug").

For each gift, format as:
**[Specific Product Name]** - [Price range: $, $$, or $$$]
Brief description of why this gift is perfect for them based on their interests.

Focus on:
- Specific brand names and product models when possible
- Items that match their interests directly
- A mix of price ranges
- Unique, thoughtful items (not generic gifts)`;
        break;

      case 'celebration_ideas':
        if (!importantDate) {
          throw new Error("importantDate required for celebration_ideas");
        }
        userPrompt = `Generate celebration ideas for an upcoming date:
- Event: ${importantDate.title}
- Date: ${importantDate.date}
- Type: ${importantDate.type}
${importantDate.person_name ? `- For: ${importantDate.person_name}` : ''}
${person ? `
About ${person.name}:
- Relationship: ${person.relationship}
${person.interests?.length ? `- Interests: ${person.interests.join(', ')}` : ''}
${person.notes ? `- Notes: ${person.notes}` : ''}
` : ''}
${userCity ? `Location: ${userCity}` : ''}
${daysUntil !== undefined ? `Days until event: ${daysUntil}` : ''}

Please provide:

**🎁 Gift Ideas** (3-4 personalized suggestions)
For each gift: name, why it's meaningful, and price range ($, $$, $$$)

**🎉 Celebration Ideas** (2-3 ways to celebrate)
${userCity ? `Include local suggestions for ${userCity} if relevant.` : ''}
Focus on experiences and meaningful gestures.

**📝 Planning Checklist**
${daysUntil !== undefined && daysUntil <= 7 ? 'Since this is coming up soon, focus on quick action items.' : ''}
3-4 actionable items to prepare for this date.

Keep it warm, practical, and not overwhelming. Prioritize quality time and thoughtfulness over expensive gifts.`;
        break;

      case 'date_ideas':
        if (!person) {
          throw new Error("Person required for date_ideas");
        }
        userPrompt = `Suggest 5 date night ideas for spending quality time with ${person.name} (${person.relationship}).
${person.interests?.length ? `Their interests include: ${person.interests.join(', ')}.` : ''}
${userCity ? `They live in or near ${userCity}.` : ''}

For each idea, provide:
- Name of the activity
- Why it would be meaningful
- Time needed (quick: 1-2hrs, evening: 3-4hrs, day trip)
- Effort level (easy, medium, requires planning)`;
        break;

      case 'activity_ideas':
        if (!person) {
          throw new Error("Person required for activity_ideas");
        }
        const isChild = person.relationship === 'child';
        userPrompt = `Suggest 5 ${isChild ? 'family activities to do with' : 'quality time activities for'} ${person.name} (${person.relationship}).
${person.interests?.length ? `Their interests include: ${person.interests.join(', ')}.` : ''}
${userCity ? `They live in or near ${userCity}.` : ''}

For each activity, provide:
- Name of the activity
- Why it creates meaningful memories
- Best time to do it (weekday evening, weekend morning, etc.)
- What makes it special`;
        break;

      case 'weekly_summary':
        if (!upcomingDates || !people) {
          throw new Error("upcomingDates and people required for weekly_summary");
        }
        const upcomingList = upcomingDates.map(d => 
          `- ${d.title}${d.person_name ? ` (${d.person_name})` : ''}: ${d.date} (${d.type})`
        ).join('\n');
        
        userPrompt = `Generate a brief, warm weekly insight for a busy parent. 

Upcoming important dates in the next 30 days:
${upcomingList || 'No upcoming dates'}

People in their life:
${people.map(p => `- ${p.name} (${p.relationship})`).join('\n')}

Provide:
1. A friendly 1-2 sentence greeting acknowledging their busy life
2. If there are upcoming dates, highlight the most pressing one with a specific, actionable suggestion
3. One gentle reminder about what matters most this week
4. Keep it under 100 words total. Be warm but concise.`;
        break;

      case 'reminder':
        if (!importantDate) {
          throw new Error("importantDate required for reminder");
        }
        userPrompt = `Create a brief, helpful reminder for an upcoming date:
- Event: ${importantDate.title}
- Date: ${importantDate.date}
- Type: ${importantDate.type}
${importantDate.person_name ? `- For: ${importantDate.person_name}` : ''}
${daysUntil !== undefined ? `- Days until: ${daysUntil}` : ''}

Provide:
1. A warm, non-stressful reminder (1-2 sentences)
2. One practical action they can take today
3. Keep it brief and supportive`;
        break;

      default:
        throw new Error(`Unknown request type: ${type}`);
    }

    console.log(`AI Assistant request: ${type}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log(`AI Assistant response generated for: ${type}`);

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI Assistant error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
