// User Suggested Prompts Types
export type UserSuggestedPromptsField = {
  suggestedPrompts: {
    report: string[];
    dashboard: string[];
    visualization: string[];
    help: string[];
  };
  updatedAt: string;
};

export const DEFAULT_USER_SUGGESTED_PROMPTS: UserSuggestedPromptsField = {
  suggestedPrompts: {
    report: [
      'provide a trend analysis of quarterly profits',
      'evaluate product performance across regions',
    ],
    dashboard: ['create a sales performance dashboard', 'design a revenue forecast dashboard'],
    visualization: ['create a metric for monthly sales', 'show top vendors by purchase volume'],
    help: [
      'what types of analyses can you perform?',
      'what questions can I as buster?',
      'what data models are available for queries?',
      'can you explain your forecasting capabilities?',
    ],
  },
  updatedAt: new Date().toISOString(),
};
