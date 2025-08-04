import { type InferSelectModel, and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { reportFiles, users } from '../../schema';
import { getUserOrganizationId } from '../organizations';

export const GetReportInputSchema = z.object({
  reportId: z.string().uuid('Report ID must be a valid UUID'),
  userId: z.string().uuid('User ID must be a valid UUID'),
});

export type GetReportInput = z.infer<typeof GetReportInputSchema>;

type Report = InferSelectModel<typeof reportFiles> & {
  created_by_id: string;
  created_by_name: string | null;
  created_by_avatar: string | null;
};

export async function getReport(input: GetReportInput): Promise<Report> {
  const validated = GetReportInputSchema.parse(input);

  const { reportId, userId } = validated;

  const userOrg = await getUserOrganizationId(userId);

  if (!userOrg?.organizationId) {
    throw new Error('User not found in any organization');
  }

  const { organizationId } = userOrg;

  const [report] = await db
    .select({
      // All reportFiles columns
      id: reportFiles.id,
      name: reportFiles.name,
      content: reportFiles.content,
      organizationId: reportFiles.organizationId,
      createdBy: reportFiles.createdBy,
      createdAt: reportFiles.createdAt,
      updatedAt: reportFiles.updatedAt,
      deletedAt: reportFiles.deletedAt,
      publiclyAccessible: reportFiles.publiclyAccessible,
      publiclyEnabledBy: reportFiles.publiclyEnabledBy,
      publicExpiryDate: reportFiles.publicExpiryDate,
      versionHistory: reportFiles.versionHistory,
      publicPassword: reportFiles.publicPassword,
      workspaceSharing: reportFiles.workspaceSharing,
      workspaceSharingEnabledBy: reportFiles.workspaceSharingEnabledBy,
      workspaceSharingEnabledAt: reportFiles.workspaceSharingEnabledAt,
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

  if (!report) {
    throw new Error('Report not found');
  }

  return report;
}
