import { db } from '@buster/database/connection';
import { messages, reportFiles } from '@buster/database/schema';
import { and, eq, isNull } from 'drizzle-orm';

/**
 * Helper to determine if a report was created in the current turn
 * (after the last user message in the conversation)
 */
export async function isReportCreatedInCurrentTurn(
  reportId: string,
  messageId: string
): Promise<boolean> {
  try {
    // Get the current message's timestamp
    const currentMessage = await db
      .select({ createdAt: messages.createdAt })
      .from(messages)
      .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)))
      .limit(1);

    if (!currentMessage.length) {
      console.warn('[report-version-helper] Message not found:', messageId);
      return false;
    }

    // Get the report's creation timestamp
    const report = await db
      .select({ createdAt: reportFiles.createdAt })
      .from(reportFiles)
      .where(and(eq(reportFiles.id, reportId), isNull(reportFiles.deletedAt)))
      .limit(1);

    if (!report.length) {
      console.warn('[report-version-helper] Report not found:', reportId);
      return false;
    }

    const messageCreatedAt = new Date(currentMessage[0]?.createdAt ?? new Date());
    const reportCreatedAt = new Date(report[0]?.createdAt ?? new Date());

    // If report was created after or at the same time as the message, it's in the current turn
    return reportCreatedAt >= messageCreatedAt;
  } catch (error) {
    console.error('[report-version-helper] Error checking report creation turn:', error);
    return false;
  }
}

/**
 * Determines if the version should be incremented based on whether
 * the report was created in the current turn
 */
export async function shouldIncrementVersion(
  reportId: string,
  messageId?: string
): Promise<boolean> {
  if (!messageId) {
    // If no messageId, always increment version (conservative approach)
    return true;
  }

  // Don't increment version if report was created in current turn
  const createdInCurrentTurn = await isReportCreatedInCurrentTurn(reportId, messageId);
  return !createdInCurrentTurn;
}

/**
 * Gets the latest version number from version history
 */
export function getLatestVersionNumber(
  versionHistory: Record<string, { version_number: number }> | null
): number {
  if (!versionHistory || Object.keys(versionHistory).length === 0) {
    return 1;
  }

  const versionNumbers = Object.values(versionHistory).map((v) => v.version_number);
  return Math.max(...versionNumbers);
}

/**
 * Creates or updates version history for a report
 */
export function updateVersionHistory(
  currentHistory: Record<
    string,
    { content: string; updated_at: string; version_number: number }
  > | null,
  content: string,
  incrementVersion: boolean
): {
  versionHistory: Record<string, { content: string; updated_at: string; version_number: number }>;
  newVersionNumber: number;
} {
  const currentVersion = getLatestVersionNumber(currentHistory);
  const newVersionNumber = incrementVersion ? currentVersion + 1 : currentVersion;
  const now = new Date().toISOString();

  const versionHistory = {
    ...(currentHistory || {}),
    [newVersionNumber.toString()]: {
      content,
      updated_at: now,
      version_number: newVersionNumber,
    },
  };

  return {
    versionHistory,
    newVersionNumber,
  };
}
