import { IBusterChat } from '../interfaces';

export const fallbackToMetricChat = (metric: {
  id: string;
  title: string | undefined;
  metricVersionNumber: number;
}): IBusterChat => {
  return {
    id: metric.id,
    isNewChat: true,
    isFollowupMessage: false,
    messages: [
      {
        request_message: null,
        response_messages: [
          {
            id: 'init',
            type: 'text',
            message: `I’ve pulled in your metric. How can I help? Is there anything you'd like to modify?`
          },
          {
            id: metric.id,
            type: 'file',
            file_type: 'metric',
            file_name: metric.title || 'New Metric',
            version_number: metric.metricVersionNumber,
            version_id: metric.id,
            metadata: [
              {
                status: 'completed',
                message: 'Retrieved metric'
              }
            ]
          }
        ],
        created_at: '',
        id: 'init-message',
        isCompletedStream: false
      }
    ],
    title: metric.title || 'New Chat',
    is_favorited: false,
    updated_at: '',
    created_at: '',
    created_by: '',
    created_by_id: '',
    created_by_name: '',
    created_by_avatar: ''
  };
};
