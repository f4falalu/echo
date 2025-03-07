import type { SelectedFile } from '../../interfaces';
import type { ChatURLParsed } from './parsePathnameSegments';

export const initializeSelectedFile = (params: ChatURLParsed): SelectedFile | undefined => {
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

  return undefined;
};
