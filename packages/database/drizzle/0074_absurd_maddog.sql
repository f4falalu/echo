-- Custom SQL migration file, put your code below! --
-- Backfill existing users' avatar_url and name from auth.users to public.users
UPDATE public.users
SET 
  avatar_url = COALESCE(auth.users.raw_user_meta_data->>'avatar_url', public.users.avatar_url),
  name = COALESCE(auth.users.raw_user_meta_data->>'full_name', public.users.name)
FROM auth.users
WHERE public.users.id = auth.users.id
AND (auth.users.raw_user_meta_data->>'avatar_url' IS NOT NULL OR auth.users.raw_user_meta_data->>'full_name' IS NOT NULL);

-- Create trigger function for public.users to set avatar_url and name on insert
CREATE OR REPLACE FUNCTION set_avatar_url_and_name_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  SELECT raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'full_name'
  INTO NEW.avatar_url, NEW.name
  FROM auth.users
  WHERE auth.users.id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on public.users before insert
CREATE TRIGGER set_avatar_url_and_name_trigger
BEFORE INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION set_avatar_url_and_name_from_auth();

-- Create trigger function for auth.users to update public.users on insert
CREATE OR REPLACE FUNCTION update_public_users_avatar_url_and_name()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET 
    avatar_url = NEW.raw_user_meta_data->>'avatar_url',
    name = NEW.raw_user_meta_data->>'full_name'
  WHERE public.users.id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users after insert
CREATE TRIGGER update_avatar_url_and_name_on_auth_insert
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION update_public_users_avatar_url_and_name();