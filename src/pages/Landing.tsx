import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, CheckCircle } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Campus Events
            </h1>
            <p className="text-2xl text-muted-foreground">
              Streamline University Event Management
            </p>
          </div>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A centralized platform for submitting, approving, and managing campus events. 
            Automate workflows, book resources, and prevent scheduling conflicts—all in one place.
          </p>

          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <div className="p-6 bg-card rounded-lg border border-border shadow-md">
              <Calendar className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Event Management</h3>
              <p className="text-sm text-muted-foreground">
                Create and manage events with ease
              </p>
            </div>

            <div className="p-6 bg-card rounded-lg border border-border shadow-md">
              <CheckCircle className="h-10 w-10 text-success mb-4" />
              <h3 className="font-semibold mb-2">Approval Workflow</h3>
              <p className="text-sm text-muted-foreground">
                Automated multi-level event approvals
              </p>
            </div>

            <div className="p-6 bg-card rounded-lg border border-border shadow-md">
              <Users className="h-10 w-10 text-secondary mb-4" />
              <h3 className="font-semibold mb-2">Resource Booking</h3>
              <p className="text-sm text-muted-foreground">
                Reserve rooms and equipment easily
              </p>
            </div>

            <div className="p-6 bg-card rounded-lg border border-border shadow-md">
              <Clock className="h-10 w-10 text-accent mb-4" />
              <h3 className="font-semibold mb-2">Conflict Prevention</h3>
              <p className="text-sm text-muted-foreground">
                Avoid scheduling conflicts automatically
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2025 Campus Events. University Event Management System.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
