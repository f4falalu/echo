# Buster Web Application

A modern React web application built with **TanStack Start**, providing a full-stack solution for data analytics, AI-powered chat interfaces, and business intelligence dashboards.

## Tech Stack

- **Framework**: TanStack Start (full-stack React framework)
- **Routing**: TanStack Router with file-based routing
- **State Management**: TanStack Query for server state, TanStack Store for client state
- **Styling**: TailwindCSS with custom design system
- **UI Components**: Radix UI primitives with custom components loosely based on ShadCN.
- **Rich Text**: Plate.js editor
- **Deployment**: Cloudflare Workers via Wrangler (github action based)

## Source Directory Structure

### `/api/`
API client layer and data fetching utilities:
- **`asset_interfaces/`** - Type definitions for asset-related API interfaces (slowly depricating as we are moving to @buster-server/shared; We should NOT be creating additional things)
- **`auth_helpers/`** - Authentication utilities and helpers (cookies, expirations, etc.)
- **`buster_rest/`** - REST API client functions and endpoints
- **`buster-electric/`** - Electric SQL real-time sync client
- **`query_keys/`** - TanStack Query key factories for caching
- **`server-functions/`** - Server-side function definitions that are build on tanstack start

### `/assets/`
Static assets and media files:
- **`png/`** - PNG images, GIFs, and icons
- **`svg/`** - SVG components and utilities

### `/components/`
React component library:
- **`features/`** - Feature-specific components (components that require server integration, or other feature specific stuff)
- **`ui/`** - Reusable UI primitives and design system components (loosely built on shadcn, but kinda not)

### `/config/`
Application configuration:
- Development settings, external routes, and language configurations

### `/context/`
React Context providers AND local store for global state:
- **`BlackBox/`** - BlackBox messaging and store functionality
- **`BusterAssets/`** - Asset management state
- **`BusterNotifications/`** - Notification system and confirm modals
- **`BusterStyles/`** - Theme and styling providers
- **`Chats/`** - Chat application state
- **`Dashboards/`** - Dashboard state management
- **`GlobalStore/`** - Global application state (modals, etc.)
- **`Metrics/`** - Metrics and analytics state
- **`Posthog/`** - PostHog analytics provider
- **`Query/`** - React Query provider (kinda of depricated)
- **`Reports/`** - Report management state
- **`Routes/`** - Routing utilities and helpers
- **`Supabase/`** - Database connection context
- **`Themes/`** - Theme operations and palette management
- **`Users/`** - User-related context and state
- **`Providers.tsx`** - Root provider composition

### `/controllers/`
Page-level controllers that orchestrate data fetching and business logic:
- **`DashboardController/`** - Dashboard page logic
- **`MetricController/`** - Metrics and analytics pages
- **`ChatsListController/`** - Chat interface management
- **`DataSourcesAddController/`** - Data source configuration
- And many more feature-specific controllers

### `/hooks/`
Custom React hooks for common functionality:
- Async effects, debouncing, local storage, viewport detection, and more

### `/integrations/`
Third-party service integrations:
- **`supabase/`** - Database integration
- **`tanstack-dev-tools/`** - Development tooling
- **`tanstack-query/`** - Query client configuration

### `/layouts/`
Layout components for different app sections:
- **`AppAssetCheckLayout/`** - Asset validation layout
- **`AssetContainer/`** - Asset management layout
- **`ChatLayout/`** - Chat interface layout

### `/lib/`
Utility functions and business logic:
- **`assets/`** - Asset processing utilities
- **`messages/`** - Chat message handling
- **`metrics/`** - Analytics and metrics calculations
- **`routes/`** - Routing utilities
- Core utilities for dates, numbers, colors, formatting, and more

### `/middleware/`
Request/response middleware:
- CSP (Content Security Policy) helpers and global security middleware

### `/mocks/`
Mock data for development and testing:
- Chart data, chat conversations, metrics, and dashboard mocks

### `/routes/`
File-based routing with TanStack Router using hierarchical layout patterns:

#### **Layout Structure & Naming Conventions**
- **`__root.tsx`** - Global app shell with providers, meta tags, and security headers
- **`app.tsx`** - Main app route with authentication, data prefetching, and user context
- **`_app.tsx`** - Primary app layout wrapper (underscore prefix creates pathless layout routes)
- **`_settings.tsx`** - Settings-specific layout with different sidebar
- **`_layout.tsx`** files - Nested layouts for asset-specific UI (dashboards, metrics, reports)

#### **Key Patterns**
- **Pathless Routes**: Underscore prefix (`_app`, `_settings`) creates layout routes that don't affect URLs
- **Server Asset Context**: Complex layouts use dedicated context files for data loading and state management
- **Layout State Persistence**: Auto-save layout preferences using `layoutId` and `initialLayout`
- **Type-Safe Navigation**: Strong typing with TypeScript interfaces and route context
- **Strategic Data Prefetching**: Layout-level data loading for optimal performance

#### **Layout Component Pattern**
```typescript
// Layout routes use dedicated components with Outlet for children
<PrimaryAppLayout initialLayout={initialLayout} layoutId={layoutId}>
  <Outlet />
</PrimaryAppLayout>
```

#### **Authentication Flow**
- Auth checks at appropriate layout levels (`beforeLoad` hooks)
- Automatic redirects to login when sessions expire
- User context provided through layout hierarchy

#### **Type-Safe Link Components**
Components that accept link props require proper TypeScript generics for type safety:

```typescript
// Components like BusterList that accept link props need router generics
export type BusterListRowLink<
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = Record<string, unknown>,
  TFrom extends string = string,
> = {
  link: ILinkProps<TRouter, TOptions, TFrom>;
  preloadDelay?: LinkProps['preloadDelay'];
  preload?: LinkProps['preload'];
};

// Usage example
const rows: BusterListRowItem<DataType, RegisteredRouter, {}, string>[] = [
  {
    id: '1',
    data: myData,
    link: {
      to: '/app/dashboard/$dashboardId',
      params: { dashboardId: '123' }
    }
  }
];
```

**Key Points:**
- Always specify `TRouter`, `TOptions`, and `TFrom` generics when using link-enabled components
- Use `RegisteredRouter` for the router type to ensure type safety with your route definitions
- Link props are validated against your actual route structure at compile time

### `/styles/`
Styling assets:
- CSS files, fonts (OTF/WOFF), and global styles

### `/types/`
TypeScript type definitions:
- Route types and shared interfaces

## Development

This project uses Turbo for all development commands as part of the monorepo:

```bash
# Install dependencies
pnpm install

# Start development server
turbo dev --filter=@buster-app/web

# Build for production
turbo build --filter=@buster-app/web

# Deploy to Cloudflare Workers
pnpm deploy:production

# Run tests
turbo test --filter=@buster-app/web

# Type checking
turbo typecheck --filter=@buster-app/web

# Or run commands for the entire monorepo
turbo build
turbo test
turbo typecheck
```

## Key Features

- **Real-time Data Sync** - Electric SQL for live data updates
- **AI-Powered Chat** - Interactive chat interfaces with AI agents
- **Analytics Dashboards** - Business intelligence and data visualization
- **Rich Text Editing** - Advanced document editing with Plate.js
- **Multi-tenant Architecture** - Workspace and team management
- **Data Source Integration** - Connect to various databases and APIs
- **Permission System** - Granular access controls and user management

The application follows a modular architecture with clear separation of concerns, making it scalable and maintainable for enterprise use.
