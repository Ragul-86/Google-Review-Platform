import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, BarChart3, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <Link to="/" className="flex items-center gap-2 font-bold text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          Google Review Boost App
        </Link>
        <Link to="/login">
          <Button variant="outline" size="sm">Sign in</Button>
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center py-20">
        <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-3 py-1 rounded-full mb-8 border border-yellow-200">
          <Sparkles className="h-3.5 w-3.5" />
          AI-powered review suggestions
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-2xl leading-tight">
          More 5-star Google reviews.<br />Less typing.
        </h1>

        <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
          Customers tap a star, pick what they loved, and our AI writes 3 review suggestions
          they can post in one click. Unhappy customers send private feedback instead —
          your reputation stays protected.
        </p>

        <div className="mt-8">
          <Link to="/login">
            <Button size="lg" className="px-8">Get started</Button>
          </Link>
        </div>

        {/* Feature cards */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl w-full text-left">
          <div className="border rounded-xl p-6 bg-card">
            <Sparkles className="h-6 w-6 mb-3 text-muted-foreground" />
            <p className="font-semibold">AI Review Suggestions</p>
            <p className="text-sm text-muted-foreground mt-1">
              3 fresh, natural reviews per category — customers pick one and submit instantly.
            </p>
          </div>
          <div className="border rounded-xl p-6 bg-card">
            <ShieldCheck className="h-6 w-6 mb-3 text-muted-foreground" />
            <p className="font-semibold">Private Negative Feedback</p>
            <p className="text-sm text-muted-foreground mt-1">
              1–3 star ratings open a private form. Issues come to you, not Google.
            </p>
          </div>
          <div className="border rounded-xl p-6 bg-card">
            <BarChart3 className="h-6 w-6 mb-3 text-muted-foreground" />
            <p className="font-semibold">Analytics &amp; Reports</p>
            <p className="text-sm text-muted-foreground mt-1">
              Track ratings, monthly trends, funnel conversion, and export to Excel.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 inline mr-1" />
        © 2026 Google Review Boost App
      </footer>
    </div>
  );
}
