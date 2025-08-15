# Asset Route Builder

A type-safe route builder for TanStack Start/Router that dynamically generates routes based on asset types and parameters.

## Overview

The Asset Route Builder provides a clean, type-safe way to generate routes for different asset types (chats, metrics, dashboards, reports) with various parameter combinations. It ensures that the generated routes match the available route files in your TanStack Start application.

## Features

- **Type Safety**: All routes are validated against `FileRouteTypes['id']` from the generated route tree
- **Fluent API**: Clean builder pattern for constructing routes
- **Dynamic Route Generation**: Automatically determines the correct route based on provided parameters
- **Parameter Extraction**: Provides params object for navigation

## Available Routes

The system supports the following route patterns:

### Single Asset Routes
- `/app/chats/$chatId`
- `/app/dashboards/$dashboardId`
- `/app/metrics/$metricId`
- `/app/reports/$reportId`

### Chat Context Routes
- `/app/chats/$chatId/dashboard/$dashboardId`
- `/app/chats/$chatId/metrics/$metricId`
- `/app/chats/$chatId/report/$reportId`

### Nested Context Routes
- `/app/chats/$chatId/dashboard/$dashboardId/metrics/$metricId`
- `/app/chats/$chatId/report/$reportId/metrics/$metricId`

## Usage

### Basic Usage with `assetParamsToRoute`

```typescript
import { assetParamsToRoute } from '@/lib/assets/assetParamsToRoute';

// Navigate to a single asset
const chatRoute = assetParamsToRoute({
  assetType: 'chat',
  assetId: 'chat-123',
});
// Returns: '/app/chats/$chatId'

// Navigate to a metric within a chat
const metricInChatRoute = assetParamsToRoute({
  assetType: 'metric',
  assetId: 'metric-456',
  chatId: 'chat-123',
});
// Returns: '/app/chats/$chatId/metrics/$metricId'

// Navigate to a metric within a dashboard in a chat
const complexRoute = assetParamsToRoute({
  assetType: 'metric',
  assetId: 'metric-789',
  chatId: 'chat-123',
  dashboardId: 'dash-456',
});
// Returns: '/app/chats/$chatId/dashboard/$dashboardId/metrics/$metricId'
```

### Using the RouteBuilder

```typescript
import { createRouteBuilder } from '@/lib/assets/assetParamsToRoute';

// Build routes step by step
const builder = createRouteBuilder()
  .withChat('chat-123')
  .withDashboard('dash-456')
  .withMetric('metric-789');

const route = builder.build();
// Returns: '/app/chats/$chatId/dashboard/$dashboardId/metrics/$metricId'

const params = builder.getParams();
// Returns: { chatId: 'chat-123', dashboardId: 'dash-456', metricId: 'metric-789' }
```

### Integration with TanStack Router

```typescript
import { useNavigate } from '@tanstack/react-router';
import { createAssetNavigation } from '@/lib/assets/assetParamsToRoute.example';

function MyComponent() {
  const navigate = useNavigate();
  
  const handleNavigation = () => {
    const { route, params } = createAssetNavigation({
      assetType: 'dashboard',
      assetId: 'dash-123',
      chatId: 'chat-456',
    });
    
    // Use with your navigation API
    navigate({ to: route, params });
  };
  
  return <button onClick={handleNavigation}>Go to Dashboard</button>;
}
```

## API Reference

### `assetParamsToRoute(params: AssetParamsToRoute): RouteFilePaths`

Main function to convert asset parameters to a route path.

#### Parameters

- `params`: An object containing:
  - `assetType`: The type of asset ('chat' | 'metric' | 'dashboard' | 'report')
  - `assetId`: The ID of the main asset
  - Additional optional context parameters (chatId, metricId, dashboardId, reportId)

#### Returns

A type-safe route path matching `FileRouteTypes['id']`.

### `createRouteBuilder(): RouteBuilder`

Creates a new RouteBuilder instance for fluent route construction.

#### RouteBuilder Methods

- `withChat(chatId: string)`: Add a chat ID to the route
- `withMetric(metricId: string)`: Add a metric ID to the route
- `withDashboard(dashboardId: string)`: Add a dashboard ID to the route
- `withReport(reportId: string)`: Add a report ID to the route
- `build()`: Build the final route path
- `getParams()`: Get the params object for navigation

## Type Definitions

```typescript
type ChatParamsToRoute = {
  assetType: 'chat';
  assetId: string;
  metricId?: string;
  dashboardId?: string;
  reportId?: string;
};

type MetricParamsToRoute = {
  assetType: 'metric';
  assetId: string;
  dashboardId?: string;
  reportId?: string;
  chatId?: string;
};

type DashboardParamsToRoute = {
  assetType: 'dashboard';
  assetId: string;
  metricId?: string;
  reportId?: string;
  chatId?: string;
};

type ReportParamsToRoute = {
  assetType: 'report';
  assetId: string;
  metricId?: string;
  chatId?: string;
};
```

## Examples

See `assetParamsToRoute.example.tsx` for comprehensive usage examples and `assetParamsToRoute.test.ts` for test cases.
