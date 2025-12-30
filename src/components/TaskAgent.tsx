import { useState } from 'react';
import { Sparkles, Plus, Clock, MapPin, CheckCircle2, X, Calendar, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';

interface ParsedTask {
  title: string;
  priority: 'low' | 'medium' | 'high';
  estimatedMinutes: number;
  isLocationDependent: boolean;
  suggestedLocation?: string;
  dueDate?: string;
  reasoning: string;
}

interface TaskAgentResponse {
  tasks: ParsedTask[];
  summary: string;
}

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-amber-500/20 text-amber-600',
  high: 'bg-destructive/20 text-destructive',
};

export function TaskAgent() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [summary, setSummary] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [addingTasks, setAddingTasks] = useState<Set<number>>(new Set());

  const handleQuickCapture = async () => {
    if (!input.trim() || !user) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('task-agent', {
        body: { 
          type: 'parse_tasks',
          input: input.trim()
        }
      });

      if (error) throw error;
      
      if (data.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('Please wait a moment and try again');
        } else {
          toast.error(data.error);
        }
        return;
      }

      const response = data as TaskAgentResponse;
      setParsedTasks(response.tasks);
      setSummary(response.summary);
      setInput('');
      toast.success('Tasks captured!');
    } catch (error) {
      console.error('Error parsing tasks:', error);
      toast.error('Failed to process your input');
    } finally {
      setIsProcessing(false);
    }
  };

  const addTaskToList = async (task: ParsedTask, index: number) => {
    if (!user) return;

    setAddingTasks(prev => new Set(prev).add(index));
    try {
      const { error } = await supabase
        .from('todos')
        .insert({
          user_id: user.id,
          title: task.title,
          priority: task.priority,
          due_date: task.dueDate || null,
          description: task.isLocationDependent 
            ? `📍 ${task.suggestedLocation || 'Location required'} • ~${task.estimatedMinutes}min`
            : `~${task.estimatedMinutes}min`,
        });

      if (error) throw error;
      
      // Remove task from parsed list
      setParsedTasks(prev => prev.filter((_, i) => i !== index));
      toast.success(`"${task.title}" added to your list`);
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    } finally {
      setAddingTasks(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const addAllTasks = async () => {
    if (!user || parsedTasks.length === 0) return;

    setIsProcessing(true);
    try {
      const tasksToInsert = parsedTasks.map(task => ({
        user_id: user.id,
        title: task.title,
        priority: task.priority,
        due_date: task.dueDate || null,
        description: task.isLocationDependent 
          ? `📍 ${task.suggestedLocation || 'Location required'} • ~${task.estimatedMinutes}min`
          : `~${task.estimatedMinutes}min`,
      }));

      const { error } = await supabase
        .from('todos')
        .insert(tasksToInsert);

      if (error) throw error;
      
      toast.success(`${parsedTasks.length} tasks added to your list`);
      setParsedTasks([]);
      setSummary('');
    } catch (error) {
      console.error('Error adding tasks:', error);
      toast.error('Failed to add tasks');
    } finally {
      setIsProcessing(false);
    }
  };

  const dismissTask = (index: number) => {
    setParsedTasks(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setParsedTasks([]);
    setSummary('');
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle 
          className="font-display text-lg flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span>Quick Capture</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </CardTitle>
        {!isExpanded && (
          <p className="text-sm text-muted-foreground mt-1">
            Type your thoughts, I'll turn them into tasks
          </p>
        )}
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Input area */}
          <div className="space-y-2">
            <Textarea
              placeholder="Type anything... haircut, send proposal, buy mom's gift, book dentist appointment..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey) {
                  handleQuickCapture();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Press ⌘+Enter or click to capture
              </p>
              <Button 
                onClick={handleQuickCapture} 
                disabled={!input.trim() || isProcessing}
                size="sm"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Capture
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Parsed tasks */}
          {parsedTasks.length > 0 && (
            <div className="space-y-3 pt-2 border-t">
              {summary && (
                <p className="text-sm text-muted-foreground italic">
                  {summary}
                </p>
              )}
              
              <div className="space-y-2">
                {parsedTasks.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card animate-fade-in"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{task.title}</p>
                        <Badge variant="secondary" className={priorityColors[task.priority]}>
                          {task.priority}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          ~{task.estimatedMinutes}min
                        </span>
                        {task.isLocationDependent && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {task.suggestedLocation || 'Location needed'}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(task.dueDate), 'MMM d')}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground/70 italic">
                        {task.reasoning}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => addTaskToList(task, index)}
                        disabled={addingTasks.has(index)}
                      >
                        {addingTasks.has(index) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => dismissTask(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Dismiss all
                </Button>
                <Button variant="default" size="sm" onClick={addAllTasks} disabled={isProcessing}>
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Add all {parsedTasks.length} tasks
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
