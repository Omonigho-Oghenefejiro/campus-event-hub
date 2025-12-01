import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  expected_attendees: number;
  status: string;
  organizer: {
    full_name: string;
    email: string;
  };
  bookings: {
    resource: {
      name: string;
      type: string;
    };
  }[];
}

const Approvals = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPendingEvents();
  }, []);

  const fetchPendingEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        organizer:profiles!events_organizer_id_fkey(full_name, email),
        bookings(
          resource:resources(name, type)
        )
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch pending events",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setEvents(data as any || []);
    setLoading(false);
  };

  const handleApproval = async (eventId: string, status: "approved" | "rejected") => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in",
          variant: "destructive",
        });
        return;
      }

      // Update event status
      const { error: eventError } = await supabase
        .from("events")
        .update({ status })
        .eq("id", eventId);

      if (eventError) throw eventError;

      // Create approval record
      const { error: approvalError } = await supabase
        .from("approvals")
        .insert({
          event_id: eventId,
          approver_id: session.user.id,
          status,
          comments: comments[eventId] || null,
        });

      if (approvalError) throw approvalError;

      // Update bookings status if approved
      if (status === "approved") {
        const { error: bookingError } = await supabase
          .from("bookings")
          .update({ status: "confirmed" })
          .eq("event_id", eventId);

        if (bookingError) throw bookingError;
      }

      toast({
        title: "Success",
        description: `Event ${status}`,
      });

      // Refresh the list
      fetchPendingEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Event Approvals</h1>
          <Badge variant="secondary">
            <Clock className="h-4 w-4 mr-1" />
            {events.length} Pending
          </Badge>
        </div>

        {events.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No pending events to review</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {events.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{event.title}</CardTitle>
                      <CardDescription>
                        Organized by {event.organizer.full_name} ({event.organizer.email})
                      </CardDescription>
                    </div>
                    <Badge variant="outline">Pending Review</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Start</p>
                      <p className="text-muted-foreground">
                        {format(new Date(event.start_time), "PPP p")}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">End</p>
                      <p className="text-muted-foreground">
                        {format(new Date(event.end_time), "PPP p")}
                      </p>
                    </div>
                    {event.location && (
                      <div>
                        <p className="font-medium">Location</p>
                        <p className="text-muted-foreground">{event.location}</p>
                      </div>
                    )}
                    {event.expected_attendees && (
                      <div>
                        <p className="font-medium">Expected Attendees</p>
                        <p className="text-muted-foreground">{event.expected_attendees}</p>
                      </div>
                    )}
                  </div>

                  {event.description && (
                    <div>
                      <p className="font-medium text-sm mb-1">Description</p>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                  )}

                  {event.bookings && event.bookings.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2">Requested Resources</p>
                      <div className="flex flex-wrap gap-2">
                        {event.bookings.map((booking, idx) => (
                          <Badge key={idx} variant="secondary">
                            {booking.resource.name} ({booking.resource.type})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor={`comments-${event.id}`}>Comments (Optional)</Label>
                    <Textarea
                      id={`comments-${event.id}`}
                      placeholder="Add any comments or feedback..."
                      value={comments[event.id] || ""}
                      onChange={(e) =>
                        setComments({ ...comments, [event.id]: e.target.value })
                      }
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => handleApproval(event.id, "rejected")}
                      className="text-destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button onClick={() => handleApproval(event.id, "approved")}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Approvals;
