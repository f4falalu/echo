import { type StorageProvider, getProviderForOrganization } from '@buster/data-source';
import { type AssetType, AssetTypeSchema } from '@buster/server-shared/assets';
import { z } from 'zod';

const GetAssetScreenshotParamsSchema = z.object({
  assetType: AssetTypeSchema,
  assetId: z.string().uuid(),
  organizationId: z.string().uuid(),
  expiresIn: z.number().int().positive().optional(),
});

export type GetAssetScreenshotParams = z.infer<typeof GetAssetScreenshotParamsSchema>;

async function resolveBucketKey(
  provider: StorageProvider,
  assetType: AssetType,
  assetId: string,
  organizationId: string
): Promise<string | null> {
  const baseKey = `screenshots/${organizationId}/${assetType}-${assetId}`;

  try {
    const objects = await provider.list(baseKey, { maxKeys: 5 });
    if (objects.length > 0) {
      const sorted = [...objects].sort((a, b) => {
        const aTime = a.lastModified?.getTime?.() ?? 0;
        const bTime = b.lastModified?.getTime?.() ?? 0;
        return bTime - aTime;
      });
      return sorted[0]?.key ?? null;
    }
  } catch (error) {
    console.error('Failed to list screenshot objects', {
      baseKey,
      assetType,
      assetId,
      error,
    });
  }

  return null;
}

export async function getAssetScreenshotSignedUrl(
  params: Readonly<GetAssetScreenshotParams>
): Promise<string> {
  const { assetType, assetId, expiresIn, organizationId } =
    GetAssetScreenshotParamsSchema.parse(params);
  const provider = await getProviderForOrganization(organizationId);
  const resolvedKey = await resolveBucketKey(provider, assetType, assetId, organizationId);

  if (!resolvedKey) {
    throw new Error('Screenshot not found for asset');
  }

  return provider.getSignedUrl(resolvedKey, expiresIn ?? 900);
}
