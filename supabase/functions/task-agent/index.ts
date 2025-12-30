import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedTask {
  title: string;
  priority: 'low' | 'medium' | 'high';
  estimatedMinutes: number;
  isLocationDependent: boolean;
  suggestedLocation?: string;
  dueDate?: string;
  reasoning: string;
}

interface ScheduleSuggestion {
  taskTitle: string;
  suggestedStart: string;
  suggestedEnd: string;
  reasoning: string;
}

interface RequestBody {
  type: 'parse_tasks' | 'suggest_schedule';
  input?: string;
  tasks?: ParsedTask[];
  userCity?: string;
  calendarEvents?: Array<{
    title: string;
    start: string;
    end: string;
    location?: string;
  }>;
  existingTodos?: Array<{
    title: string;
    due_date?: string;
    priority: string;
  }>;
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
    const { type, input, tasks, userCity, calendarEvents, existingTodos } = body;

    let systemPrompt = `You are a quiet, intelligent task assistant for Horizon, an app for busy parents.
Your role is to reduce mental load by turning quick thoughts into planned action.
You are NOT a project manager. You suggest, never command.
Be warm, practical, and never overwhelming.`;

    let userPrompt = "";
    let tools: any[] = [];
    let toolChoice: any = undefined;

    switch (type) {
      case 'parse_tasks':
        if (!input) {
          throw new Error("Input required for parse_tasks");
        }
        
        systemPrompt += `
When parsing tasks:
- Infer reasonable durations (haircut: 60min, email: 15min, grocery shopping: 45min, etc.)
- Identify location-dependent tasks (haircut, gym, dry cleaning, doctor, dentist, etc.)
- Determine soft urgency based on context clues
- Split compound inputs into separate tasks if needed
- Be practical about priorities - most daily tasks are medium priority`;

        userPrompt = `Parse this quick capture input into actionable tasks:

"${input}"

Consider:
- What discrete tasks are mentioned?
- How long might each task realistically take?
- Is each task location-dependent (requires being at a specific place)?
- What's a reasonable priority level?`;

        tools = [{
          type: "function",
          function: {
            name: "create_tasks",
            description: "Create actionable tasks from parsed input",
            parameters: {
              type: "object",
              properties: {
                tasks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { 
                        type: "string",
                        description: "Clear, actionable task title" 
                      },
                      priority: { 
                        type: "string", 
                        enum: ["low", "medium", "high"],
                        description: "Task priority - most daily tasks are medium"
                      },
                      estimatedMinutes: { 
                        type: "number",
                        description: "Realistic time estimate in minutes"
                      },
                      isLocationDependent: { 
                        type: "boolean",
                        description: "Whether task requires being at a specific location"
                      },
                      suggestedLocation: { 
                        type: "string",
                        description: "Where the task needs to happen, if location-dependent"
                      },
                      dueDate: { 
                        type: "string",
                        description: "Suggested due date in YYYY-MM-DD format, if urgency is implied"
                      },
                      reasoning: { 
                        type: "string",
                        description: "Brief explanation of why you set these values"
                      }
                    },
                    required: ["title", "priority", "estimatedMinutes", "isLocationDependent", "reasoning"],
                    additionalProperties: false
                  }
                },
                summary: {
                  type: "string",
                  description: "Brief, friendly summary of what was captured"
                }
              },
              required: ["tasks", "summary"],
              additionalProperties: false
            }
          }
        }];
        toolChoice = { type: "function", function: { name: "create_tasks" } };
        break;

      case 'suggest_schedule':
        if (!tasks || tasks.length === 0) {
          throw new Error("Tasks required for suggest_schedule");
        }

        const tasksDescription = tasks.map(t => 
          `- ${t.title} (${t.estimatedMinutes}min, ${t.isLocationDependent ? 'location: ' + (t.suggestedLocation || 'TBD') : 'anywhere'})`
        ).join('\n');

        const eventsDescription = calendarEvents?.length 
          ? calendarEvents.map(e => 
              `- ${e.title}: ${e.start} to ${e.end}${e.location ? ` at ${e.location}` : ''}`
            ).join('\n')
          : 'No calendar events available';

        userPrompt = `Suggest optimal time slots for these tasks:

Tasks to schedule:
${tasksDescription}

${userCity ? `User's home city: ${userCity}` : ''}

Upcoming calendar events:
${eventsDescription}

Consider:
- Don't suggest times that conflict with existing events
- For location-dependent tasks, check if user will be in the right area
- Leave reasonable buffers between activities
- Prefer suggesting times rather than forcing immediate scheduling
- Be realistic about energy levels (don't schedule demanding tasks late evening)

Explain your reasoning clearly so the user understands why each time was chosen.`;

        tools = [{
          type: "function",
          function: {
            name: "suggest_schedule",
            description: "Suggest optimal time slots for tasks",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      taskTitle: { type: "string" },
                      suggestedStart: { 
                        type: "string",
                        description: "ISO datetime for suggested start"
                      },
                      suggestedEnd: { 
                        type: "string",
                        description: "ISO datetime for suggested end"
                      },
                      reasoning: { 
                        type: "string",
                        description: "Human-friendly explanation of why this time works"
                      }
                    },
                    required: ["taskTitle", "suggestedStart", "suggestedEnd", "reasoning"],
                    additionalProperties: false
                  }
                },
                overallAdvice: {
                  type: "string",
                  description: "Brief, warm advice about the suggested schedule"
                }
              },
              required: ["suggestions", "overallAdvice"],
              additionalProperties: false
            }
          }
        }];
        toolChoice = { type: "function", function: { name: "suggest_schedule" } };
        break;

      default:
        throw new Error(`Unknown request type: ${type}`);
    }

    console.log(`Task Agent request: ${type}`);

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
        tools,
        tool_choice: toolChoice,
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
    console.log("AI response:", JSON.stringify(data, null, 2));
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log(`Task Agent response generated for: ${type}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Task Agent error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
