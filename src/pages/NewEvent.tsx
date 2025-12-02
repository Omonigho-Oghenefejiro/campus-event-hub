import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Lock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { z } from "zod";

interface Resource {
  id: string;
  name: string;
  type: string;
  available: boolean;
  location: string;
  capacity: number | null;
}

// Form validation schema
const eventFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().max(2000).optional(),
  location: z.string().max(255).optional(),
  expectedAttendees: z.string().optional().refine((val) => !val || !isNaN(parseInt(val)), "Must be a valid number"),
  notes: z.string().max(2000).optional(),
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface FormErrors {
  [key: string]: string;
}

const NewEventContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOrganizer, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [errors, setErrors] = useState<FormErrors>({});
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    startTime: "",
    endTime: "",
    expectedAttendees: "",
    notes: "",
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .eq("available", true)
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch resources",
        variant: "destructive",
      });
      return;
    }

    setResources(data || []);
  };

  const handleResourceToggle = (resourceId: string) => {
    setSelectedResources((prev) =>
      prev.includes(resourceId)
        ? prev.filter((id) => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Event title is required";
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    if (!startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!endDate) {
      newErrors.endDate = "End date is required";
    }

    if (!formData.startTime) {
      newErrors.startTime = "Start time is required";
    }

    if (!formData.endTime) {
      newErrors.endTime = "End time is required";
    }

    if (startDate && endDate && startDate > endDate) {
      newErrors.dates = "Start date must be before end date";
    }

    if (formData.expectedAttendees && isNaN(parseInt(formData.expectedAttendees))) {
      newErrors.expectedAttendees = "Expected attendees must be a valid number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    if (!isOrganizer) {
      toast({
        title: "Permission Denied",
        description: "Only organizers can create events",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to create an event",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Combine date and time
      const startDateTime = startDate && formData.startTime 
        ? new Date(`${format(startDate, "yyyy-MM-dd")}T${formData.startTime}`)
        : null;
      const endDateTime = endDate && formData.endTime
        ? new Date(`${format(endDate, "yyyy-MM-dd")}T${formData.endTime}`)
        : null;

      if (!startDateTime || !endDateTime) {
        toast({
          title: "Error",
          description: "Please select both start and end dates/times",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (endDateTime <= startDateTime) {
        toast({
          title: "Error",
          description: "End time must be after start time",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create event
      const { data: event, error: eventError } = await supabase
        .from("events")
        .insert({
          title: formData.title.trim(),
          description: formData.description || null,
          location: formData.location || null,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          expected_attendees: formData.expectedAttendees ? parseInt(formData.expectedAttendees) : null,
          notes: formData.notes || null,
          organizer_id: session.user.id,
          status: "pending_approval",
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Create bookings for selected resources
      if (selectedResources.length > 0) {
        const bookings = selectedResources.map((resourceId) => ({
          event_id: event.id,
          resource_id: resourceId,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: "pending",
        }));

        const { error: bookingError } = await supabase
          .from("bookings")
          .insert(bookings);

        if (bookingError) throw bookingError;
      }

      toast({
        title: "Success!",
        description: "Event created and submitted for approval. Admins will review it shortly.",
      });

      navigate("/events");
    } catch (error: any) {
      console.error("Event creation error:", error);
      toast({
        title: "Error creating event",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {!roleLoading && !isOrganizer ? (
        <div className="max-w-2xl mx-auto">
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <Lock className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-destructive">Access Denied</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Only organizers can create events. If you believe you should have access, please contact an administrator.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate("/dashboard")}
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Create New Event</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
                <CardDescription>Fill in the details for your event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-base">
                    Event Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Annual Tech Conference"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      if (errors.title) setErrors({ ...errors, title: "" });
                    }}
                    className={errors.title ? "border-destructive" : ""}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive mt-1">{errors.title}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your event in detail..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-base">
                      Start Date <span className="text-destructive">*</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground",
                            errors.startDate && "border-destructive"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.startDate && (
                      <p className="text-sm text-destructive mt-1">{errors.startDate}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="startTime" className="text-base">
                      Start Time <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => {
                        setFormData({ ...formData, startTime: e.target.value });
                        if (errors.startTime) setErrors({ ...errors, startTime: "" });
                      }}
                      className={errors.startTime ? "border-destructive" : ""}
                    />
                    {errors.startTime && (
                      <p className="text-sm text-destructive mt-1">{errors.startTime}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-base">
                      End Date <span className="text-destructive">*</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground",
                            errors.endDate && "border-destructive"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.endDate && (
                      <p className="text-sm text-destructive mt-1">{errors.endDate}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="endTime" className="text-base">
                      End Time <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => {
                        setFormData({ ...formData, endTime: e.target.value });
                        if (errors.endTime) setErrors({ ...errors, endTime: "" });
                      }}
                      className={errors.endTime ? "border-destructive" : ""}
                    />
                    {errors.endTime && (
                      <p className="text-sm text-destructive mt-1">{errors.endTime}</p>
                    )}
                  </div>
                </div>

                {errors.dates && (
                  <p className="text-sm text-destructive">{errors.dates}</p>
                )}

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Main Auditorium"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="expectedAttendees">Expected Attendees</Label>
                  <Input
                    id="expectedAttendees"
                    type="number"
                    placeholder="e.g., 150"
                    value={formData.expectedAttendees}
                    onChange={(e) => {
                      setFormData({ ...formData, expectedAttendees: e.target.value });
                      if (errors.expectedAttendees) setErrors({ ...errors, expectedAttendees: "" });
                    }}
                    className={errors.expectedAttendees ? "border-destructive" : ""}
                  />
                  {errors.expectedAttendees && (
                    <p className="text-sm text-destructive mt-1">{errors.expectedAttendees}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional information for admins..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Selection</CardTitle>
                <CardDescription>Select the resources you need for your event (optional)</CardDescription>
              </CardHeader>
              <CardContent>
                {resources.length === 0 ? (
                  <p className="text-muted-foreground">No resources available</p>
                ) : (
                  <div className="space-y-3">
                    {resources.map((resource) => (
                      <div key={resource.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={resource.id}
                          checked={selectedResources.includes(resource.id)}
                          onCheckedChange={() => handleResourceToggle(resource.id)}
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={resource.id}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {resource.name}
                          </label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {resource.type} • {resource.location}
                            {resource.capacity && ` • Capacity: ${resource.capacity}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => navigate("/events")}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || roleLoading}>
                {loading ? "Creating Event..." : "Create Event"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
};

const NewEvent = () => {
  return (
    <ProtectedRoute requiredRole="organizer">
      <NewEventContent />
    </ProtectedRoute>
  );
};

export default NewEvent;
