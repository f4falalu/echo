import { Link, useNavigate } from '@tanstack/react-router';
import {
  type AssetParamsToRoute,
  assetParamsToRoute,
  assetParamsToRoutePath,
} from './assetParamsToRoute';
import { navigationOptionsToHref, toHref } from './typeSafeNavigation';

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

  // Example 5: Converting navigation options to href
  const reportNavOptions = assetParamsToRoute({
    assetType: 'report',
    assetId: 'report-999',
    chatId: 'chat-123',
  });

  // Convert to actual URL
  const reportHref = navigationOptionsToHref(reportNavOptions);
  console.log(reportHref); // '/app/chats/chat-123/report/report-999'

  // Example 6: Using with native anchor tags
  const dashboardHref = toHref(dashboardNavOptions);
  // dashboardHref is: '/app/chats/chat-123/dashboard/dash-789/metrics/metric-456'

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

      {/* Native anchor tag with href */}
      <a href={dashboardHref}>Go to Dashboard (native anchor)</a>

      {/* Example with custom styling or external link behavior */}
      <a href={reportHref} target="_blank" rel="noopener noreferrer" className="external-link">
        Open Report in New Tab
      </a>
    </div>
  );
}

// Example function that accepts AssetParamsToRoute
export function createAssetLink(params: AssetParamsToRoute) {
  const navOptions = assetParamsToRoute(params);
  const href = toHref(navOptions);

  // You can use either Link component or native anchor
  return (
    <>
      {/* Option 1: TanStack Router Link */}
      <Link {...navOptions}>View {params.assetType}</Link>

      {/* Option 2: Native anchor with href */}
      <a href={href} className="asset-link">
        View {params.assetType} (native)
      </a>
    </>
  );
}

// Example: Creating hrefs for external use (emails, sharing, etc.)
export function generateShareableLinks() {
  const chatOptions = assetParamsToRoute({
    assetType: 'chat',
    assetId: 'chat-123',
  });

  const metricOptions = assetParamsToRoute({
    assetType: 'metric',
    assetId: 'metric-456',
    chatId: 'chat-123',
  });

  // Convert to absolute URLs for sharing
  const baseUrl = window.location.origin;
  const chatHref = baseUrl + toHref(chatOptions);
  const metricHref = baseUrl + toHref(metricOptions);

  console.log('Share these links:');
  console.log('Chat:', chatHref); // https://example.com/app/chats/chat-123
  console.log('Metric:', metricHref); // https://example.com/app/chats/chat-123/metrics/metric-456

  return { chatHref, metricHref };
}
