import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, Home, LogOut, Settings, Users, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { useUserRole } from "@/hooks/use-user-role";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();
  const { role, loading: roleLoading } = useUserRole();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Campus Events
            </h1>
            {!roleLoading && role && (
              <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">
                {role === "admin" ? "Administrator" : role}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.full_name || "User"}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            {role !== "student" && (
              <Button
                variant="ghost"
                className="rounded-none border-b-2 border-transparent hover:border-primary"
                onClick={() => navigate("/dashboard")}
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            )}
            {(role === "admin" || role === "organizer") && (
              <Button
                variant="ghost"
                className="rounded-none border-b-2 border-transparent hover:border-primary"
                onClick={() => navigate("/events")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Events
              </Button>
            )}
            {role === "student" && (
              <Button
                variant="ghost"
                className="rounded-none border-b-2 border-transparent hover:border-primary"
                onClick={() => navigate("/events")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Upcoming Events
              </Button>
            )}
            {role === "organizer" && (
              <Button
                variant="ghost"
                className="rounded-none border-b-2 border-transparent hover:border-primary"
                onClick={() => navigate("/new-event")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            )}
            {role !== "student" && (
              <Button
                variant="ghost"
                className="rounded-none border-b-2 border-transparent hover:border-primary"
                onClick={() => navigate("/resources")}
              >
                <Package className="h-4 w-4 mr-2" />
                Resources
              </Button>
            )}
            {role === "admin" && (
              <>
                <Button
                  variant="ghost"
                  className="rounded-none border-b-2 border-transparent hover:border-primary"
                  onClick={() => navigate("/approvals")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Approvals
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-none border-b-2 border-transparent hover:border-primary"
                  onClick={() => navigate("/settings")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};
