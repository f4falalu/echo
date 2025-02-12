

# WebSocket-React Query Integration

## Overview
This feature integrates the WebSocket's `emitAndOnce` functionality with React Query's powerful caching and state management capabilities. It provides a type-safe, efficient way to handle WebSocket requests while leveraging React Query's features like caching, refetching, and loading states.

## Core Types

```typescript
interface UseBusterSocketQueryOptions<TData, TError = unknown> extends 
  Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  socketRequest: BusterSocketRequest;
  socketResponse: Omit<BusterSocketResponse, 'callback' | 'onError'>;
}

type UseBusterSocketQueryResult<TData, TError = unknown> = UseQueryResult<TData, TError>;
```

## Hook Implementation

```typescript
function useBusterSocketQuery<TData, TError = unknown>({
  socketRequest,
  socketResponse,
  ...queryOptions
}: UseBusterSocketQueryOptions<TData, TError>): UseBusterSocketQueryResult<TData, TError> {
  const busterSocket = useBusterWebSocket();
  
  return useQuery({
    queryKey: [socketResponse.route, socketRequest.payload],
    queryFn: async () => {
      return busterSocket.emitAndOnce({
        emitEvent: socketRequest,
        responseEvent: {
          ...socketResponse,
          callback: (data: TData) => data,
          onError: (error: TError) => {
            throw error;
          }
        }
      }) as Promise<TData>;
    },
    ...queryOptions
  });
}
```

## Default Configuration

```typescript
const DEFAULT_OPTIONS = {
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  retry: 0,
  staleTime: 0
};
```

## Usage Examples

### Basic Usage
```typescript
function MetricsList() {
  const { data, isLoading } = useBusterSocketQuery({
    socketRequest: {
      route: '/metrics/list',
      payload: { page: 1, pageSize: 10 }
    },
    socketResponse: {
      route: '/metrics/list:getMetricList'
    }
  });
  
  if (isLoading) return <Loading />;
  return <MetricsTable data={data} />;
}
```

### With Custom Options
```typescript
function CachedMetricData() {
  const { data } = useBusterSocketQuery({
    socketRequest: {
      route: '/metrics/get',
      payload: { id: 'metric-123' }
    },
    socketResponse: {
      route: '/metrics/get:getMetric'
    },
    staleTime: 60000, // Cache for 1 minute
    enabled: !!metricId
  });
}
```

## Key Features

### 1. Type Safety
- Full TypeScript support with generic types for request/response payloads
- Leverages existing WebSocket interface definitions
- Type inference with minimal explicit type annotations

### 2. Error Handling
- Integration with BusterNotifications system
- Type-safe error propagation
- Support for custom error callbacks

### 3. Caching Strategy
- Uses route and payload as query keys
- Configurable stale times
- Cache invalidation through react-query's methods

### 4. Performance Optimizations
- Memoized callbacks and event handlers
- Connection status management
- Automatic cleanup on unmount

## Implementation Guidelines

### 1. File Structure
```
src/
  hooks/
    useBusterSocketQuery/
      index.ts           # Main hook export
      types.ts          # TypeScript interfaces
      config.ts         # Default configurations
      helpers.ts        # Utility functions
```

### 2. Integration Points
- BusterWebSocket context
- React Query provider
- Error notification system

### 3. Testing Strategy
- Unit tests for hook behavior
- Integration tests with WebSocket mock
- Type testing for TypeScript interfaces

## Migration Guide

### 1. Converting Existing WebSocket Calls
```typescript
// Before
const response = await busterSocket.emitAndOnce({
  emitEvent: { route: '/metrics/get', payload: { id: 'metric-123' } },
  responseEvent: { route: '/metrics/get:response' }
});

// After
const { data } = useBusterSocketQuery({
  socketRequest: { route: '/metrics/get', payload: { id: 'metric-123' } },
  socketResponse: { route: '/metrics/get:response' }
});
```

### 2. Handling Subscriptions
For real-time updates, combine with React Query's `invalidateQueries`:
```typescript
const queryClient = useQueryClient();

// Invalidate queries when receiving updates
busterSocket.on({
  route: '/metrics/updated',
  callback: () => {
    queryClient.invalidateQueries({ queryKey: ['metrics'] });
  }
});
```

## Best Practices

1. **Query Keys**
   - Use consistent key structure
   - Include all relevant parameters
   - Consider query key factories

2. **Error Handling**
   - Always provide error boundaries
   - Use type-safe error objects
   - Handle network disconnections

3. **Performance**
   - Configure appropriate stale times
   - Use selective refetching
   - Implement proper cleanup

4. **Type Safety**
   - Maintain strict TypeScript checks
   - Use proper generics
   - Avoid type assertions when possible
