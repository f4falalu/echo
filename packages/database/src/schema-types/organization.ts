import { z } from 'zod';

// Sharing setting enum
export const SharingSettingSchema = z.enum(['none', 'team', 'organization', 'public']);
export type SharingSetting = z.infer<typeof SharingSettingSchema>;

// Workspace sharing enum
export const WorkspaceSharingSchema = z.enum(['none', 'can_view', 'can_edit', 'full_access']);
export type WorkspaceSharing = z.infer<typeof WorkspaceSharingSchema>;

// Organization Color Palette Types
export type OrganizationColorPalette = {
  id: string;
  colors: string[]; // Hex color codes
  name: string;
};

export type OrganizationColorPalettes = {
  selectedId: string | null;
  palettes: OrganizationColorPalette[];
  selectedDictionaryPalette: OrganizationColorPalette | null;
};
