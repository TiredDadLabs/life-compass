import { Header, BottomNav } from '@/components/Navigation';
import { TodoList } from '@/components/TodoList';
import { ContextualRestReminder } from '@/components/emotional';

export default function TodosPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Late night reminder */}
        <ContextualRestReminder page="todos" />

        <section className="animate-fade-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <h2 className="font-display text-2xl font-semibold text-foreground mb-6">
            Your To-Do List
          </h2>
          <TodoList />
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
