import type { SelectedFile } from '../../interfaces';
import { useGetChatParams } from '../useGetChatParams';

export const createSelectedFile = (
  params: ReturnType<typeof useGetChatParams>
): SelectedFile | null => {
  const { metricId, collectionId, datasetId, dashboardId, chatId, messageId } = params;

  if (metricId) {
    return {
      id: metricId,
      type: 'metric'
    };
  }

  if (dashboardId) {
    return {
      id: dashboardId,
      type: 'dashboard'
    };
  }

  if (messageId) {
    return {
      id: messageId,
      type: 'reasoning'
    };
  }

  return null;
};
