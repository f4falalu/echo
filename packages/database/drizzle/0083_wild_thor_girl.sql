ALTER TABLE "organizations" ALTER COLUMN "organization_color_palettes" SET DEFAULT '{"selectedId": null, "palettes": [], "selectedDictionaryPalette": null}'::jsonb;--> statement-breakpoint
UPDATE "organizations" 
SET "organization_color_palettes" = 
  CASE 
    WHEN "organization_color_palettes" ? 'selectedDictionaryPalette' 
    THEN "organization_color_palettes"
    ELSE "organization_color_palettes" || '{"selectedDictionaryPalette": null}'::jsonb
  END
WHERE "organization_color_palettes" IS NOT NULL;--> statement-breakpoint
