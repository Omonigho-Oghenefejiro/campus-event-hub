import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, ArrowLeft, UserCheck } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useUserRole();
  const { toast } = useToast();
  const [event, setEvent] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    if (!id) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Fetch current user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();

    setCurrentUser(profile);

    // Fetch event details
    const { data: eventData } = await supabase
      .from("events")
      .select("*, profiles(full_name)")
      .eq("id", id)
      .maybeSingle();

    if (eventData) {
      setEvent(eventData);
    }

    // Fetch registrations for this event
    const { data: regs } = await supabase
      .from("event_registrations")
      .select("*")
      .eq("event_id", id);

    if (regs) {
      setRegistrations(regs);
      // Check if current user is already registered
      const alreadyRegistered = regs.some(
        (r) => r.student_email === session.user.email
      );
      setIsRegistered(alreadyRegistered);
    }

    setLoading(false);
  };

  const handleRegister = async () => {
    if (!currentUser || !event) return;

    setRegistering(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("event_registrations")
        .insert({
          event_id: event.id,
          student_name: currentUser.full_name,
          student_email: session.user.email,
        });

      if (error) throw error;

      toast({
        title: "Registration Successful! 🎉",
        description: `You have been registered for "${event.title}"`,
      });

      setIsRegistered(true);
      fetchEventDetails(); // Refresh registrations
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      pending_approval: "secondary",
      approved: "default",
      rejected: "destructive",
      cancelled: "outline",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p className="text-muted-foreground mb-4">This event doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/events")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isOrganizer = role === "organizer" || role === "admin";
  const canRegister = role === "student" && event.status === "approved";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate("/events")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>

        {/* Event Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{event.title}</CardTitle>
                <CardDescription className="mt-2">
                  Organized by {event.profiles?.full_name || "Unknown"}
                </CardDescription>
              </div>
              {getStatusBadge(event.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium text-foreground">
                      {new Date(event.start_time).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p>
                      {new Date(event.start_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(event.end_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-5 w-5 mr-3" />
                    <span>{event.location}</span>
                  </div>
                )}

                {event.expected_attendees && (
                  <div className="flex items-center text-muted-foreground">
                    <Users className="h-5 w-5 mr-3" />
                    <span>Expected: {event.expected_attendees} attendees</span>
                  </div>
                )}
              </div>

              <div>
                {event.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-muted-foreground">{event.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Registration Section for Students */}
            {canRegister && (
              <div className="pt-4 border-t">
                {isRegistered ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <UserCheck className="h-5 w-5" />
                    <span className="font-medium">You are registered for this event!</span>
                  </div>
                ) : (
                  <Button onClick={handleRegister} disabled={registering} size="lg">
                    {registering ? "Registering..." : "Register for this Event"}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registrations Section for Organizers/Admins */}
        {isOrganizer && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Registered Students ({registrations.length})
              </CardTitle>
              <CardDescription>
                Students who have registered for this event
              </CardDescription>
            </CardHeader>
            <CardContent>
              {registrations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No students have registered yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {registrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{reg.student_name}</p>
                        <p className="text-sm text-muted-foreground">{reg.student_email}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(reg.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EventDetails;
