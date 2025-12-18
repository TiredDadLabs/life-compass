import { useState, useEffect } from 'react';
import { Plus, Check, Circle, Trash2, Calendar, Flag, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Todo {
  id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-amber-500/20 text-amber-600',
  high: 'bg-destructive/20 text-destructive',
};

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export function TodoList() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTodo, setNewTodo] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newDueDate, setNewDueDate] = useState<Date | undefined>(undefined);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTodos();
    }
  }, [user]);

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('is_completed', { ascending: true })
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos((data || []).map(t => ({
        ...t,
        priority: t.priority as 'low' | 'medium' | 'high',
      })));
    } catch (error) {
      console.error('Error fetching todos:', error);
      toast.error('Failed to load todos');
    } finally {
      setIsLoading(false);
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim() || !user) return;

    setIsAdding(true);
    try {
      const { data, error } = await supabase
        .from('todos')
        .insert({
          user_id: user.id,
          title: newTodo.trim(),
          priority: newPriority,
          due_date: newDueDate ? format(newDueDate, 'yyyy-MM-dd') : null,
        })
        .select()
        .single();

      if (error) throw error;
      const newTodoItem: Todo = {
        ...data,
        priority: data.priority as 'low' | 'medium' | 'high',
      };
      setTodos([newTodoItem, ...todos]);
      setNewTodo('');
      setNewDueDate(undefined);
      toast.success('Todo added');
    } catch (error) {
      console.error('Error adding todo:', error);
      toast.error('Failed to add todo');
    } finally {
      setIsAdding(false);
    }
  };

  const toggleTodo = async (id: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ is_completed: !isCompleted })
        .eq('id', id);

      if (error) throw error;
      setTodos(todos.map(t => t.id === id ? { ...t, is_completed: !isCompleted } : t));
    } catch (error) {
      console.error('Error updating todo:', error);
      toast.error('Failed to update todo');
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTodos(todos.filter(t => t.id !== id));
      toast.success('Todo deleted');
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast.error('Failed to delete todo');
    }
  };

  const incompleteTodos = todos.filter(t => !t.is_completed);
  const completedTodos = todos.filter(t => t.is_completed);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Check className="w-5 h-5 text-primary" />
          To-Do List
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new todo */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
              className="flex-1"
            />
            <Button onClick={addTodo} disabled={!newTodo.trim() || isAdding} size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !newDueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newDueDate ? format(newDueDate, "PPP") : <span>Due date (optional)</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={newDueDate}
                  onSelect={setNewDueDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <Select value={newPriority} onValueChange={(v: 'low' | 'medium' | 'high') => setNewPriority(v)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Todo list */}
        <div className="space-y-2">
          {incompleteTodos.length === 0 && completedTodos.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No tasks yet. Add one above!
            </p>
          ) : (
            <>
              {incompleteTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                />
              ))}
              
              {completedTodos.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    Completed ({completedTodos.length})
                  </p>
                  {completedTodos.map((todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      onToggle={toggleTodo}
                      onDelete={deleteTodo}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TodoItem({
  todo,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  onToggle: (id: string, isCompleted: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border bg-card transition-all',
        todo.is_completed && 'opacity-60'
      )}
    >
      <Checkbox
        checked={todo.is_completed}
        onCheckedChange={() => onToggle(todo.id, todo.is_completed)}
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium truncate',
            todo.is_completed && 'line-through text-muted-foreground'
          )}
        >
          {todo.title}
        </p>
        {todo.due_date && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3" />
            {format(new Date(todo.due_date), 'MMM d')}
          </p>
        )}
      </div>
      <Badge variant="secondary" className={priorityColors[todo.priority]}>
        {priorityLabels[todo.priority]}
      </Badge>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(todo.id)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
