-- Create event_registrations table for students to register for events
CREATE TABLE public.event_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  student_email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(event_id, student_email)
);

-- Enable RLS
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Everyone can view registrations
CREATE POLICY "Everyone can view registrations"
ON public.event_registrations
FOR SELECT
USING (true);

-- Anyone can register for events (students don't need to be authenticated)
CREATE POLICY "Anyone can register for events"
ON public.event_registrations
FOR INSERT
WITH CHECK (true);

-- Event organizers and admins can view registrations for their events
CREATE POLICY "Organizers can view their event registrations"
ON public.event_registrations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_registrations.event_id
    AND (events.organizer_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Add trigger for updated_at on event_registrations
CREATE TRIGGER update_event_registrations_updated_at
BEFORE UPDATE ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();