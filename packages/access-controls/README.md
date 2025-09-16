# Access Controls Package

Permission and security logic for the Buster platform. This package enforces access control policies across the entire application.

## Installation

```bash
pnpm add @buster/access-controls
```

## Overview

`@buster/access-controls` provides:
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

## Usage

### Basic Permission Check

```typescript
import { checkPermission } from '@buster/access-controls';

const canAccess = await checkPermission({
  user: currentUser,
  action: 'read',
  resource: {
    type: 'dashboard',
    id: 'dash-123',
    organizationId: 'org-456'
  }
});

if (!canAccess) {
  throw new ForbiddenError('Access denied');
}
```

### Role Definitions

```typescript
import { Roles } from '@buster/access-controls';

// Available roles
const roles = {
  OWNER: 'owner',    // Full access
  ADMIN: 'admin',    // Admin access
  MEMBER: 'member',  // Read/write access
  VIEWER: 'viewer'   // Read-only access
};
```

### Resource Access Control

```typescript
import { canAccessResource } from '@buster/access-controls';

const hasAccess = await canAccessResource({
  user: currentUser,
  resource: {
    type: 'datasource',
    id: 'ds-123'
  }
});
```

## Permission System

### Granular Permissions

```typescript
import { Permissions } from '@buster/access-controls';

// Available permissions
const permissions = {
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
};
```

### Checking Specific Permissions

```typescript
import { checkUserPermission } from '@buster/access-controls';

const canCreateDashboard = await checkUserPermission(
  userId,
  Permissions.DASHBOARD_CREATE
);
```

## Multi-Tenant Security

### Organization Boundaries

```typescript
import { enforceOrganizationBoundary } from '@buster/access-controls';

// Ensure user and resource belong to same organization
await enforceOrganizationBoundary(
  userId,
  organizationId,
  resourceId
);
```

### Cross-Organization Access

```typescript
import { checkCrossOrgAccess } from '@buster/access-controls';

const canShare = await checkCrossOrgAccess({
  sourceOrg: org1,
  targetOrg: org2,
  user: currentUser
});
```

## Authentication

### Session Validation

```typescript
import { validateSession } from '@buster/access-controls';

const user = await validateSession(sessionToken);
if (!user) {
  throw new UnauthorizedError('Invalid session');
}
```

### API Key Authentication

```typescript
import { validateApiKey } from '@buster/access-controls';

const validation = await validateApiKey(apiKey);
if (!validation.valid) {
  throw new UnauthorizedError('Invalid API key');
}

// Use validated context
const { userId, organizationId, scopes } = validation;
```

## Middleware Integration

### Hono Middleware

```typescript
import { requirePermission } from '@buster/access-controls';

// Protect routes with permission checks
app.get('/api/dashboards/:id', 
  requireAuth(),
  requirePermission(Permissions.DASHBOARD_READ),
  getDashboardHandler
);

app.post('/api/dashboards',
  requireAuth(),
  requirePermission(Permissions.DASHBOARD_CREATE),
  createDashboardHandler
);
```

### Custom Middleware

```typescript
export function requireRole(role: Role) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    const hasRole = await checkUserRole(user.id, role);
    
    if (!hasRole) {
      return c.json({ error: 'Insufficient privileges' }, 403);
    }
    
    await next();
  };
}
```

## Security Policies

### Rate Limiting

```typescript
import { checkRateLimit } from '@buster/access-controls';

const allowed = await checkRateLimit(userId, 'api_call');
if (!allowed) {
  throw new RateLimitError('Too many requests');
}
```

### IP Allowlisting

```typescript
import { checkIpAllowlist } from '@buster/access-controls';

const allowed = await checkIpAllowlist(
  organizationId,
  request.ip
);

if (!allowed) {
  throw new ForbiddenError('IP not allowed');
}
```

## Audit Logging

```typescript
import { logSecurityEvent } from '@buster/access-controls';

// Log security-relevant events
await logSecurityEvent({
  type: 'permission_denied',
  userId: user.id,
  resource: resource.id,
  action: 'delete',
  ipAddress: request.ip,
  timestamp: new Date()
});
```

## Error Handling

```typescript
import { 
  SecurityError,
  ForbiddenError,
  UnauthorizedError 
} from '@buster/access-controls';

try {
  await checkPermission(params);
} catch (error) {
  if (error instanceof ForbiddenError) {
    // User doesn't have permission
    return res.status(403).json({ error: 'Access denied' });
  }
  
  if (error instanceof UnauthorizedError) {
    // User not authenticated
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Other security error
  throw error;
}
```

## Testing

### Unit Tests

```typescript
describe('checkPermission', () => {
  it('should allow owner all actions', async () => {
    const result = await checkPermission({
      user: { id: '1', role: 'owner' },
      action: 'delete',
      resource: { type: 'dashboard', id: '123', organizationId: 'org1' }
    });
    
    expect(result).toBe(true);
  });
  
  it('should deny viewer write access', async () => {
    const result = await checkPermission({
      user: { id: '2', role: 'viewer' },
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

## Development

```bash
# Build
turbo build --filter=@buster/access-controls

# Test
turbo test:unit --filter=@buster/access-controls
turbo test:integration --filter=@buster/access-controls

# Lint
turbo lint --filter=@buster/access-controls
```

This package is critical for platform security. Always err on the side of denying access when in doubt.