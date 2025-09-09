import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../connection';
import { docs, organizations } from '../../schema';
import { deleteDoc } from './delete-doc';

describe('deleteDoc', () => {
  let testOrgId: string;
  let testDocId: string;

  beforeEach(async () => {
    // Create test organization
    const [org] = await db
      .insert(organizations)
      .values({
        id: randomUUID(),
        name: `Test Org ${Date.now()}-${randomUUID().slice(0, 8)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    testOrgId = org.id;

    // Create test doc
    const [doc] = await db
      .insert(docs)
      .values({
        id: randomUUID(),
        name: 'Test Doc',
        content: 'Test content',
        type: 'normal',
        organizationId: testOrgId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    testDocId = doc.id;
  });

  afterEach(async () => {
    // Clean up test data
    if (testDocId) {
      await db.delete(docs).where(eq(docs.id, testDocId));
    }
    if (testOrgId) {
      await db.delete(organizations).where(eq(organizations.id, testOrgId));
    }
  });

  it('should soft delete a doc', async () => {
    const result = await deleteDoc({
      id: testDocId,
      organizationId: testOrgId,
    });

    expect(result).not.toBeNull();
    expect(result?.id).toBe(testDocId);
    expect(result?.deletedAt).not.toBeNull();

    // Verify doc is soft deleted in database
    const [dbDoc] = await db.select().from(docs).where(eq(docs.id, testDocId));

    expect(dbDoc.deletedAt).not.toBeNull();
  });

  it('should update updatedAt when soft deleting', async () => {
    const originalDoc = await db.select().from(docs).where(eq(docs.id, testDocId)).limit(1);

    const originalUpdatedAt = originalDoc[0].updatedAt;

    // Wait a bit to ensure different timestamp
    await new Promise((resolve) => setTimeout(resolve, 10));

    const result = await deleteDoc({
      id: testDocId,
      organizationId: testOrgId,
    });

    expect(result?.updatedAt).not.toBe(originalUpdatedAt);
  });

  it('should return null for non-existent doc', async () => {
    const result = await deleteDoc({
      id: randomUUID(),
      organizationId: testOrgId,
    });

    expect(result).toBeNull();
  });

  it('should not delete already soft deleted docs', async () => {
    // First soft delete
    await db
      .update(docs)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(docs.id, testDocId));

    const result = await deleteDoc({
      id: testDocId,
      organizationId: testOrgId,
    });

    expect(result).toBeNull();
  });

  it('should not delete doc from different organization', async () => {
    // Create another org
    const [org2] = await db
      .insert(organizations)
      .values({
        id: randomUUID(),
        name: `Test Org 2 ${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    const result = await deleteDoc({
      id: testDocId,
      organizationId: org2.id, // Wrong org
    });

    expect(result).toBeNull();

    // Verify doc is not deleted
    const [dbDoc] = await db.select().from(docs).where(eq(docs.id, testDocId));

    expect(dbDoc.deletedAt).toBeNull();

    // Clean up
    await db.delete(organizations).where(eq(organizations.id, org2.id));
  });

  it('should validate input with Zod schema', async () => {
    const invalidData = {
      id: 'not-a-uuid',
      organizationId: 'also-not-a-uuid',
    };

    await expect(deleteDoc(invalidData)).rejects.toThrow();
  });
});
