-- Custom SQL migration file, put your code below! --
CREATE OR REPLACE FUNCTION public.auto_add_user_to_organizations()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  user_domain text;
  org_record public.organizations%ROWTYPE;
BEGIN
  IF EXISTS (SELECT 1 FROM public.users_to_organizations WHERE public.users_to_organizations.user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  user_domain := split_part(NEW.email, '@', 2);

  FOR org_record IN
    SELECT * FROM public.organizations
    WHERE user_domain = ANY(public.organizations.domains)
  LOOP
    INSERT INTO public.users_to_organizations (
      user_id,
      organization_id,
      role,
      sharing_setting,
      edit_sql,
      upload_csv,
      export_assets,
      email_slack_enabled,
      created_at,
      updated_at,
      deleted_at,
      created_by,
      updated_by,
      deleted_by,
      status
    ) VALUES (
      NEW.id,
      org_record.id,
      org_record.default_role,
      'none'::public.sharing_setting_enum,
      false,
      false,
      false,
      false,
      now(),
      now(),
      null,
      NEW.id,
      NEW.id,
      null,
      'active'::public.user_organization_status_enum
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_add_to_orgs_trigger
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_add_user_to_organizations();