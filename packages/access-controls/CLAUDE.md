# Access Controls Package

This package manages all permission and security logic for the Buster platform. It enforces access control policies across the entire application.

## Core Responsibility

`@buster/access-controls` is responsible for:
- User authentication and authorization
- Role-based access control (RBAC)
- Resource-level permissions
- Security policy enforcement
- Permission validation and checking

## Security Model

```
User → Roles → Permissions → Resources
         ↓
    Organization
    (Multi-tenant)
```

## Permission Architecture

### Functional Permission Checks

All permission checks are pure functions:

```typescript
import { z } from 'zod';
import type { User, Organization, Resource } from '@buster/database';

// Permission check schema
const CheckPermissionParamsSchema = z.object({
  user: z.custom<User>().describe('User requesting access'),
  action: z.enum(['read', 'write', 'delete', 'admin']).describe('Action to perform'),
  resource: z.object({
    type: z.enum(['dashboard', 'metric', 'datasource', 'chat', 'organization']),
    id: z.string().uuid(),
    organizationId: z.string().uuid()
  }).describe('Resource to access')
});

type CheckPermissionParams = z.infer<typeof CheckPermissionParamsSchema>;

// Pure function for permission checking
export async function checkPermission(params: CheckPermissionParams): Promise<boolean> {
  const validated = CheckPermissionParamsSchema.parse(params);
  
  // Check organization membership
  if (!await isUserInOrganization(validated.user.id, validated.resource.organizationId)) {
    return false;
  }
  
  // Get user's role in organization
  const role = await getUserRole(validated.user.id, validated.resource.organizationId);
  
  // Check role permissions
  return hasRolePermission(role, validated.action, validated.resource.type);
}
```

### Role Definitions

```typescript
export const Roles = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer'
} as const;

export type Role = typeof Roles[keyof typeof Roles];

const RolePermissions: Record<Role, Permission[]> = {
  [Roles.OWNER]: ['*'], // All permissions
  [Roles.ADMIN]: [
    'dashboard:*',
    'metric:*',
    'datasource:*',
    'chat:*',
    'user:read',
    'user:write'
  ],
  [Roles.MEMBER]: [
    'dashboard:read',
    'dashboard:write',
    'metric:read',
    'metric:write',
    'datasource:read',
    'chat:*'
  ],
  [Roles.VIEWER]: [
    'dashboard:read',
    'metric:read',
    'datasource:read',
    'chat:read'
  ]
};
```

## Resource-Level Permissions

### Resource Access Control

```typescript
export async function canAccessResource(params: AccessParams): Promise<boolean> {
  const { user, resource } = params;
  
  // Check resource-specific permissions
  switch (resource.type) {
    case 'dashboard':
      return canAccessDashboard(user, resource.id);
    case 'datasource':
      return canAccessDataSource(user, resource.id);
    case 'chat':
      return canAccessChat(user, resource.id);
    default:
      return false;
  }
}

async function canAccessDashboard(user: User, dashboardId: string): Promise<boolean> {
  // Check if dashboard is public
  const dashboard = await getDashboard(dashboardId);
  if (dashboard.isPublic) {
    return true;
  }
  
  // Check if user owns the dashboard
  if (dashboard.createdBy === user.id) {
    return true;
  }
  
  // Check if user has organization access
  return checkPermission({
    user,
    action: 'read',
    resource: {
      type: 'dashboard',
      id: dashboardId,
      organizationId: dashboard.organizationId
    }
  });
}
```

### Granular Permissions

```typescript
export const Permissions = {
  // Dashboard permissions
  DASHBOARD_CREATE: 'dashboard:create',
  DASHBOARD_READ: 'dashboard:read',
  DASHBOARD_UPDATE: 'dashboard:update',
  DASHBOARD_DELETE: 'dashboard:delete',
  DASHBOARD_SHARE: 'dashboard:share',
  
  // Data source permissions
  DATASOURCE_CREATE: 'datasource:create',
  DATASOURCE_READ: 'datasource:read',
  DATASOURCE_UPDATE: 'datasource:update',
  DATASOURCE_DELETE: 'datasource:delete',
  DATASOURCE_QUERY: 'datasource:query',
  
  // Organization permissions
  ORG_MANAGE_MEMBERS: 'org:manage_members',
  ORG_MANAGE_BILLING: 'org:manage_billing',
  ORG_MANAGE_SETTINGS: 'org:manage_settings'
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];
```

## Multi-Tenant Security

### Organization Isolation

```typescript
export async function enforceOrganizationBoundary(
  userId: string,
  organizationId: string,
  resourceId: string
): Promise<void> {
  // Verify user belongs to organization
  const membership = await getOrganizationMembership(userId, organizationId);
  if (!membership) {
    throw new ForbiddenError('User is not a member of this organization');
  }
  
  // Verify resource belongs to organization
  const resource = await getResource(resourceId);
  if (resource.organizationId !== organizationId) {
    throw new ForbiddenError('Resource does not belong to this organization');
  }
}
```

### Cross-Organization Access

```typescript
export async function checkCrossOrgAccess(params: CrossOrgParams): Promise<boolean> {
  const { sourceOrg, targetOrg, user } = params;
  
  // Check if organizations have sharing agreement
  const sharingEnabled = await checkOrgSharing(sourceOrg, targetOrg);
  if (!sharingEnabled) {
    return false;
  }
  
  // Check user's role in source organization
  const role = await getUserRole(user.id, sourceOrg.id);
  return role === Roles.OWNER || role === Roles.ADMIN;
}
```

## Authentication Helpers

### Session Validation

```typescript
export async function validateSession(sessionToken: string): Promise<User | null> {
  // Validate token format
  if (!isValidTokenFormat(sessionToken)) {
    return null;
  }
  
  // Check session exists and is not expired
  const session = await getSession(sessionToken);
  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  
  // Return associated user
  return getUserById(session.userId);
}
```

### API Key Authentication

```typescript
const ApiKeySchema = z.object({
  key: z.string().min(32).describe('API key'),
  scopes: z.array(z.string()).describe('Allowed scopes')
});

export async function validateApiKey(key: string): Promise<ApiKeyValidation> {
  const apiKey = await getApiKey(key);
  
  if (!apiKey || apiKey.revokedAt) {
    return { valid: false };
  }
  
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false };
  }
  
  return {
    valid: true,
    userId: apiKey.userId,
    organizationId: apiKey.organizationId,
    scopes: apiKey.scopes
  };
}
```

## Permission Middleware

### Hono Middleware Pattern

```typescript
import type { Context } from 'hono';

export function requirePermission(permission: Permission) {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const hasPermission = await checkUserPermission(user.id, permission);
    if (!hasPermission) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    
    await next();
  };
}

// Usage in routes
app.get('/api/dashboards/:id', 
  requireAuth(),
  requirePermission(Permissions.DASHBOARD_READ),
  getDashboardHandler
);
```

## Security Policies

### Rate Limiting

```typescript
export async function checkRateLimit(userId: string, action: string): Promise<boolean> {
  const key = `rate_limit:${userId}:${action}`;
  const limit = getRateLimitForAction(action);
  
  const count = await incrementCounter(key);
  if (count > limit.maxRequests) {
    return false;
  }
  
  // Set expiry for sliding window
  await setExpiry(key, limit.windowSeconds);
  return true;
}
```

### IP Allowlisting

```typescript
export async function checkIpAllowlist(
  organizationId: string,
  ipAddress: string
): Promise<boolean> {
  const allowlist = await getOrgIpAllowlist(organizationId);
  
  if (allowlist.length === 0) {
    return true; // No restrictions
  }
  
  return allowlist.some(range => isIpInRange(ipAddress, range));
}
```

## Audit Logging

### Security Event Logging

```typescript
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  const eventLog = {
    ...event,
    timestamp: new Date(),
    id: generateId()
  };
  
  // Store in audit log
  await createAuditLog(eventLog);
  
  // Alert on suspicious activity
  if (isSuspicious(event)) {
    await alertSecurityTeam(event);
  }
}

// Usage
await logSecurityEvent({
  type: 'permission_denied',
  userId: user.id,
  resource: resource.id,
  action: 'delete',
  ipAddress: request.ip
});
```

## Testing Patterns

### Unit Tests

```typescript
describe('checkPermission', () => {
  it('should allow owner all actions', async () => {
    const mockUser = { id: '1', role: 'owner' };
    
    const result = await checkPermission({
      user: mockUser,
      action: 'delete',
      resource: { type: 'dashboard', id: '123', organizationId: 'org1' }
    });
    
    expect(result).toBe(true);
  });
  
  it('should deny viewer write access', async () => {
    const mockUser = { id: '2', role: 'viewer' };
    
    const result = await checkPermission({
      user: mockUser,
      action: 'write',
      resource: { type: 'dashboard', id: '123', organizationId: 'org1' }
    });
    
    expect(result).toBe(false);
  });
});
```

## Best Practices

### DO:
- Use functional permission checks
- Validate all inputs with Zod
- Implement defense in depth
- Log security events
- Use principle of least privilege
- Check permissions at every layer
- Implement rate limiting
- Use secure session management

### DON'T:
- Hardcode permissions
- Trust client-side checks
- Skip permission validation
- Store plain text passwords
- Log sensitive data
- Use predictable tokens
- Allow unlimited access
- Bypass security for convenience

## Error Handling

### Security Error Messages

```typescript
export class SecurityError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 403
  ) {
    // Don't expose internal details
    super(message);
    this.name = 'SecurityError';
  }
}

export class ForbiddenError extends SecurityError {
  constructor(message = 'Access denied') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class UnauthorizedError extends SecurityError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
  }
}
```

This package is critical for platform security. Always err on the side of denying access when in doubt.