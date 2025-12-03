-- Update role to admin for user with email admin1@gmail.com if they exist
UPDATE public.user_roles 
SET role = 'admin'
WHERE user_id IN (
  SELECT id FROM public.profiles WHERE email = 'admin1@gmail.com'
);

-- Also create a trigger to automatically assign admin role to this specific email on signup
CREATE OR REPLACE FUNCTION public.assign_admin_to_specific_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'admin1@gmail.com' THEN
    UPDATE public.user_roles 
    SET role = 'admin' 
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger that fires after the handle_new_user trigger creates the profile and role
CREATE TRIGGER on_admin_email_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_admin_to_specific_email();