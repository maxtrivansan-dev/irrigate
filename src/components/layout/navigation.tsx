import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  Home,
  BarChart3,
  TrendingUp,
  History,
  Settings,
  Zap,
  Menu,
  Droplets,
  Cloud,
  Camera,
  Cherry,
  Worm,
} from "lucide-react";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Analysis", href: "/analysis", icon: TrendingUp },
  { name: "History", href: "/history", icon: History },
  { name: "Weather", href: "/weather", icon: Cloud },
  { name: "Power Quality", href: "/energy", icon: Zap },
  { name: "Land Monitor", href: "/land-monitoring", icon: Camera },
  { name: "Fruit Detection", href: "/tomato-detection", icon: Cherry },
  { name: "Leaf Disease", href: "/leaf-disease", icon: Worm },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Navigation() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <div
      className={cn("flex gap-1", mobile ? "flex-col space-y-1" : "flex-row")}
    >
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => mobile && setOpen(false)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Droplets className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="hidden sm:inline">Smart Irrigation</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex">
          <NavLinks />
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Mobile Navigation */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-4 pt-6">
                <Link
                  to="/"
                  className="flex items-center gap-2 font-bold text-lg"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <Droplets className="h-5 w-5 text-primary-foreground" />
                  </div>
                  Smart Irrigation
                </Link>
                <nav>
                  <NavLinks mobile />
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
