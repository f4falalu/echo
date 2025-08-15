import { Link, useNavigate } from '@tanstack/react-router';
import {
  type AssetParamsToRoute,
  assetParamsToRoute,
  assetParamsToRoutePath,
} from './assetParamsToRoute';

// Example React component showing usage
export function AssetNavigationExample() {
  const navigate = useNavigate();

  // Example 1: Navigate to a chat
  const handleNavigateToChat = () => {
    const navOptions = assetParamsToRoute({
      assetType: 'chat',
      assetId: 'chat-123',
    });

    // navOptions is type-safe with:
    // { to: '/app/chats/$chatId', params: { chatId: 'chat-123' } }
    navigate(navOptions);
  };

  // Example 2: Navigate to a metric within a chat
  const handleNavigateToMetricInChat = () => {
    const navOptions = assetParamsToRoute({
      assetType: 'metric',
      assetId: 'metric-456',
      chatId: 'chat-123',
    });

    // navOptions is type-safe with:
    // { to: '/app/chats/$chatId/metrics/$metricId', params: { chatId: 'chat-123', metricId: 'metric-456' } }
    navigate(navOptions);
  };

  // Example 3: Using with Link component
  const dashboardNavOptions = assetParamsToRoute({
    assetType: 'dashboard',
    assetId: 'dash-789',
    chatId: 'chat-123',
    metricId: 'metric-456',
  });

  // Example 4: Getting just the path (backward compatibility)
  const justThePath = assetParamsToRoutePath({
    assetType: 'report',
    assetId: 'report-999',
    chatId: 'chat-123',
  });
  console.log(justThePath); // '/app/chats/$chatId/report/$reportId'

  return (
    <div>
      <button type="button" onClick={handleNavigateToChat}>
        Go to Chat
      </button>
      <button type="button" onClick={handleNavigateToMetricInChat}>
        Go to Metric in Chat
      </button>

      {/* Link component with spread operator */}
      <Link {...dashboardNavOptions}>Go to Dashboard</Link>

      {/* Link component with explicit props */}
      <Link to={dashboardNavOptions.to} params={dashboardNavOptions.params}>
        Go to Dashboard (explicit)
      </Link>
    </div>
  );
}

// Example function that accepts AssetParamsToRoute
export function createAssetLink(params: AssetParamsToRoute) {
  const navOptions = assetParamsToRoute(params);

  return <Link {...navOptions}>View {params.assetType}</Link>;
}
