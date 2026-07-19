import { Link, useLocation } from "wouter";
import { 
  Ticket, 
  ShieldAlert, 
  Users, 
  Leaf, 
  Menu 
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Fan Portal", icon: Ticket },
    { path: "/ops", label: "Ops Dashboard", icon: ShieldAlert },
    { path: "/volunteer", label: "Volunteer Hub", icon: Users },
    { path: "/sustainability", label: "Sustainability", icon: Leaf },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/*
       * Skip-to-content link — invisible until focused via keyboard (Tab).
       * This is the single highest-ROI a11y addition: keyboard and screen reader
       * users skip the repeated nav on every page without any visual cost.
       */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:border focus:border-ring focus:px-4 focus:py-2 focus:rounded-md focus:text-foreground focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur-lg">
        <div className="flex h-16 items-center px-4 md:px-6">
          {/* Logo — aria-label gives screen readers the full app name since the icon is decorative */}
          <div
            className="flex items-center gap-2 font-bold tracking-tight text-lg mr-8 text-primary uppercase font-mono"
            aria-label="StadiumAI — FIFA World Cup 2026"
          >
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
            <span aria-hidden="true">StadiumAI</span>
          </div>

          {/*
           * aria-label distinguishes this from any other <nav> regions on the page.
           * aria-current="page" on the active link lets screen readers announce
           * "current page" without needing colour or visual weight as the only cue.
           */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium" aria-label="Main navigation">
            {navItems.map((item) => {
              const isActive = location === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 transition-colors hover:text-foreground/80",
                    isActive ? "text-foreground" : "text-foreground/60"
                  )}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/*
           * aria-label describes the action clearly.
           * aria-expanded communicates the open/closed state to screen readers.
           * aria-controls links the button to the menu it controls.
           */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden ml-auto"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Mobile navigation"
          className="md:hidden border-b bg-card p-4 space-y-2 flex flex-col"
        >
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-md transition-colors",
                  isActive ? "bg-secondary text-foreground font-medium" : "text-foreground/60 hover:bg-secondary/50"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}

      {/* id="main-content" is the skip-link target */}
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  );
}
