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
      <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur-lg">
        <div className="flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-2 font-bold tracking-tight text-lg mr-8 text-primary uppercase font-mono">
            <ShieldAlert className="h-5 w-5" />
            <span>StadiumAI</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = location === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center gap-2 transition-colors hover:text-foreground/80",
                    isActive ? "text-foreground" : "text-foreground/60"
                  )}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden ml-auto"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="md:hidden border-b bg-card p-4 space-y-2 flex flex-col">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-md transition-colors",
                  isActive ? "bg-secondary text-foreground font-medium" : "text-foreground/60 hover:bg-secondary/50"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
