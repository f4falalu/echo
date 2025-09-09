import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../connection';
import { docs, organizations } from '../../schema';
import { getDoc } from './get-doc';

describe('getDoc', () => {
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

  it('should retrieve an existing doc', async () => {
    const result = await getDoc({
      id: testDocId,
      organizationId: testOrgId,
    });

    expect(result).not.toBeNull();
    expect(result?.id).toBe(testDocId);
    expect(result?.name).toBe('Test Doc');
    expect(result?.content).toBe('Test content');
    expect(result?.type).toBe('normal');
    expect(result?.organizationId).toBe(testOrgId);
  });

  it('should return null for non-existent doc', async () => {
    const result = await getDoc({
      id: randomUUID(),
      organizationId: testOrgId,
    });

    expect(result).toBeNull();
  });

  it('should not return soft deleted docs', async () => {
    // Soft delete the doc
    await db
      .update(docs)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(docs.id, testDocId));

    const result = await getDoc({
      id: testDocId,
      organizationId: testOrgId,
    });

    expect(result).toBeNull();
  });

  it('should not return doc from different organization', async () => {
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

    const result = await getDoc({
      id: testDocId,
      organizationId: org2.id, // Wrong org
    });

    expect(result).toBeNull();

    // Clean up
    await db.delete(organizations).where(eq(organizations.id, org2.id));
  });

  it('should validate input with Zod schema', async () => {
    const invalidData = {
      id: 'not-a-uuid',
      organizationId: 'also-not-a-uuid',
    };

    await expect(getDoc(invalidData)).rejects.toThrow();
  });
});
