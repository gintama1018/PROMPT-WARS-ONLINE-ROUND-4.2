import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center space-y-4">
      <h1 className="text-6xl font-black text-muted-foreground font-mono">404</h1>
      <p className="text-xl text-foreground font-medium">Page Not Found</p>
      <Link href="/">
        <Button>Return to Fan Portal</Button>
      </Link>
    </div>
  );
}
