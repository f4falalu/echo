-- Custom SQL migration file, put your code below! --

-- Add asset permissions for chat owners
INSERT INTO public.asset_permissions (
    identity_id,
    identity_type,
    asset_id,
    asset_type,
    role,
    created_by,
    updated_by,
    created_at,
    updated_at
)
SELECT 
    c.created_by as identity_id,
    'user'::identity_type_enum as identity_type,
    c.id as asset_id,
    'chat'::asset_type_enum as asset_type,
    'owner'::asset_permission_role_enum as role,
    c.created_by as created_by,
    c.created_by as updated_by,
    NOW() as created_at,
    NOW() as updated_at
FROM public.chats c
WHERE c.deleted_at IS NULL
AND NOT EXISTS (
    SELECT 1 
    FROM public.asset_permissions ap 
    WHERE ap.asset_id = c.id 
    AND ap.asset_type = 'chat'::asset_type_enum
    AND ap.identity_id = c.created_by 
    AND ap.identity_type = 'user'::identity_type_enum
    AND ap.deleted_at IS NULL
);
