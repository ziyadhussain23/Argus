import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  LayoutDashboard,
  Server,
  AlertTriangle,
  Book,
  History,
  Shield,
  Home,
  LogOut,
  Moon, 
  Sun
} from "lucide-react";
import { useTheme } from "next-themes";

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem onSelect={() => runCommand(() => navigate("/dashboard"))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/servers"))}>
              <Server className="mr-2 h-4 w-4" />
              <span>Servers</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/alerts"))}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              <span>Alerts</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem onSelect={() => runCommand(() => navigate("/settings"))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/profile"))}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/status"))}>
              <Calculator className="mr-2 h-4 w-4" />
              <span>System Status</span>
            </CommandItem>
          </CommandGroup>
           <CommandSeparator />
           <CommandGroup heading="Resources">
            <CommandItem onSelect={() => runCommand(() => navigate("/docs"))}>
              <Book className="mr-2 h-4 w-4" />
              <span>Documentation</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/history"))}>
              <History className="mr-2 h-4 w-4" />
              <span>History</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light Mode</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark Mode</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
