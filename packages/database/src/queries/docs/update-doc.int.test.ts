import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../connection';
import { docs, organizations } from '../../schema';
import { updateDoc } from './update-doc';

describe('updateDoc', () => {
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
        name: 'Original Name',
        content: 'Original content',
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

  it('should update doc name', async () => {
    const result = await updateDoc({
      id: testDocId,
      organizationId: testOrgId,
      name: 'Updated Name',
    });

    expect(result).not.toBeNull();
    expect(result?.name).toBe('Updated Name');
    expect(result?.content).toBe('Original content'); // Unchanged
    expect(result?.type).toBe('normal'); // Unchanged
  });

  it('should update doc content', async () => {
    const result = await updateDoc({
      id: testDocId,
      organizationId: testOrgId,
      content: 'Updated content',
    });

    expect(result).not.toBeNull();
    expect(result?.name).toBe('Original Name'); // Unchanged
    expect(result?.content).toBe('Updated content');
  });

  it('should update doc type', async () => {
    const result = await updateDoc({
      id: testDocId,
      organizationId: testOrgId,
      type: 'analyst',
    });

    expect(result).not.toBeNull();
    expect(result?.type).toBe('analyst');
  });

  it('should update multiple fields at once', async () => {
    const result = await updateDoc({
      id: testDocId,
      organizationId: testOrgId,
      name: 'New Name',
      content: 'New content',
      type: 'analyst',
    });

    expect(result).not.toBeNull();
    expect(result?.name).toBe('New Name');
    expect(result?.content).toBe('New content');
    expect(result?.type).toBe('analyst');
  });

  it('should update updatedAt timestamp', async () => {
    const originalDoc = await db.select().from(docs).where(eq(docs.id, testDocId)).limit(1);

    const originalUpdatedAt = originalDoc[0].updatedAt;

    // Wait a bit to ensure different timestamp
    await new Promise((resolve) => setTimeout(resolve, 10));

    const result = await updateDoc({
      id: testDocId,
      organizationId: testOrgId,
      name: 'Updated Name',
    });

    expect(result?.updatedAt).not.toBe(originalUpdatedAt);
  });

  it('should return null for non-existent doc', async () => {
    const result = await updateDoc({
      id: randomUUID(),
      organizationId: testOrgId,
      name: 'Updated Name',
    });

    expect(result).toBeNull();
  });

  it('should not update soft deleted docs', async () => {
    // Soft delete the doc
    await db
      .update(docs)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(docs.id, testDocId));

    const result = await updateDoc({
      id: testDocId,
      organizationId: testOrgId,
      name: 'Updated Name',
    });

    expect(result).toBeNull();
  });

  it('should not update doc from different organization', async () => {
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

    const result = await updateDoc({
      id: testDocId,
      organizationId: org2.id, // Wrong org
      name: 'Updated Name',
    });

    expect(result).toBeNull();

    // Clean up
    await db.delete(organizations).where(eq(organizations.id, org2.id));
  });

  it('should validate input with Zod schema', async () => {
    const invalidData = {
      id: 'not-a-uuid',
      organizationId: 'also-not-a-uuid',
      name: '', // Empty name should fail
    };

    await expect(updateDoc(invalidData)).rejects.toThrow();
  });
});
