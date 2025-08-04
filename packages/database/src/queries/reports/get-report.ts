import { type InferSelectModel, and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { reportFiles, users } from '../../schema';
import { getUserOrganizationId } from '../organizations';

export const GetReportInputSchema = z.object({
  reportId: z.string().uuid('Report ID must be a valid UUID'),
  userId: z.string().uuid('User ID must be a valid UUID'),
});

type GetReportInput = z.infer<typeof GetReportInputSchema>;

export async function getReport(input: GetReportInput) {
  const validated = GetReportInputSchema.parse(input);

  const { reportId, userId } = validated;

  const userOrg = await getUserOrganizationId(userId);

  if (!userOrg?.organizationId) {
    throw new Error('User not found in any organization');
  }

  const { organizationId } = userOrg;

  const [reportData] = await db
    .select({
      // All reportFiles columns
      id: reportFiles.id,
      name: reportFiles.name,
      content: reportFiles.content,
      created_at: reportFiles.createdAt,
      updated_at: reportFiles.updatedAt,
      publicly_accessible: reportFiles.publiclyAccessible,
      public_expiry_date: reportFiles.publicExpiryDate,
      version_history: reportFiles.versionHistory,
      public_password: reportFiles.publicPassword,
      workspace_sharing: reportFiles.workspaceSharing,
      // User metadata
      created_by_id: users.id,
      created_by_name: users.name,
      created_by_avatar: users.avatarUrl,
    })
    .from(reportFiles)
    .innerJoin(users, eq(reportFiles.createdBy, users.id))
    .where(
      and(
        eq(reportFiles.id, reportId),
        eq(reportFiles.organizationId, organizationId),
        isNull(reportFiles.deletedAt)
      )
    )
    .limit(1);

  if (!reportData) {
    throw new Error('Report not found');
  }

  // Transform version_history from Record to array of { version_number, updated_at }
  // Convert version_history object to array and sort by version_number ascending
  const versionHistoryArray = Object.values(reportData.version_history)
    .map((version) => ({
      version_number: version.version_number,
      updated_at: version.updated_at,
    }))
    .sort((a, b) => a.version_number - b.version_number);

  const report = {
    ...reportData,
    version_number: versionHistoryArray[versionHistoryArray.length - 1]?.version_number ?? 1,
    version_history: versionHistoryArray,
  };

  return report;
}
