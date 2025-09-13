import { z } from 'zod';

export const UserSuggestedPromptsSchema = z.object({
  suggestedPrompts: z.object({
    report: z.array(z.string()),
    dashboard: z.array(z.string()),
    visualization: z.array(z.string()),
    help: z.array(z.string()),
  }),
  updatedAt: z.string(),
});

export const UserPersonalizationConfigSchema = z.object({
  currentRole: z.string().optional(),
  customInstructions: z.string().optional(),
  additionalInformation: z.string().optional(),
});

export const UserShortcutTrackingSchema = z.object({
  lastUsedShortcuts: z.array(z.string().uuid()).default([]),
});

export type UserSuggestedPromptsType = z.infer<typeof UserSuggestedPromptsSchema>;
export type UserPersonalizationConfigType = z.infer<typeof UserPersonalizationConfigSchema>;
export type UserShortcutTrackingType = z.infer<typeof UserShortcutTrackingSchema>;

export const DEFAULT_USER_SUGGESTED_PROMPTS: UserSuggestedPromptsType = {
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
