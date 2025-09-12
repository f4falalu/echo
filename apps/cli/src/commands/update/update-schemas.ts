import { z } from 'zod';

// Update command options schema
export const UpdateOptionsSchema = z.object({
  check: z.boolean().default(false), // Just check for updates, don't install
  force: z.boolean().default(false), // Force update even if on latest version
  yes: z.boolean().default(false), // Skip confirmation prompt
});

export type UpdateOptions = z.infer<typeof UpdateOptionsSchema>;

// Update result schema
export const UpdateResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  currentVersion: z.string(),
  latestVersion: z.string().optional(),
  isHomebrew: z.boolean().default(false),
});

export type UpdateResult = z.infer<typeof UpdateResultSchema>;

// Platform-specific binary info
export const BinaryInfoSchema = z.object({
  fileName: z.string(),
  downloadUrl: z.string().url(),
  checksumUrl: z.string().url(),
});

export type BinaryInfo = z.infer<typeof BinaryInfoSchema>;
