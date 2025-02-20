import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { ArrowRight, Brain, Clock, ListChecks } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          TaskAI
        </h1>
        <div className="space-x-4">
          {user ? (
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          ) : (
            <Link href="/auth">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            AI-Powered Task Management Reimagined
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline your workflow with intelligent task management. Let AI help you prioritize, organize, and accomplish more.
          </p>
          <div className="flex justify-center gap-4">
            <Link href={user ? "/dashboard" : "/auth"}>
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <h3 className="text-3xl font-bold text-center mb-12">
            Work Smarter
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg border bg-card">
              <Brain className="h-12 w-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">AI-Powered Insights</h4>
              <p className="text-muted-foreground">
                Get intelligent suggestions for task prioritization and smart breakdowns of complex projects.
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <Clock className="h-12 w-12 text-primary mb-4" />
              <p className="text-xl font-semibold mb-2">Real-time Updates</p>
              <p className="text-muted-foreground">
                Stay in sync with your team through instant updates and real-time collaboration features.
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <ListChecks className="h-12 w-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Smart Task Management</h4>
              <p className="text-muted-foreground">
                Efficiently organize and track tasks with automated priority assignment and progress tracking.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
