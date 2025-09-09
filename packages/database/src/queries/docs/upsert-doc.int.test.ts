import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../connection';
import { docs, organizations } from '../../schema';
import { upsertDoc } from './upsert-doc';

describe('upsertDoc', () => {
  let testOrgId: string;
  const testDocIds: string[] = [];

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
  });

  afterEach(async () => {
    // Clean up test docs
    for (const id of testDocIds) {
      await db.delete(docs).where(eq(docs.id, id));
    }
    testDocIds.length = 0;

    // Clean up test organization
    if (testOrgId) {
      await db.delete(organizations).where(eq(organizations.id, testOrgId));
    }
  });

  it('should create a new doc when it does not exist', async () => {
    const docData = {
      name: 'Test Doc',
      content: 'Test content',
      type: 'normal' as const,
      organizationId: testOrgId,
    };

    const result = await upsertDoc(docData);
    testDocIds.push(result.id);

    expect(result.name).toBe(docData.name);
    expect(result.content).toBe(docData.content);
    expect(result.type).toBe(docData.type);
    expect(result.organizationId).toBe(testOrgId);
    expect(result.deletedAt).toBeNull();
  });

  it('should update existing doc when name and organizationId match', async () => {
    // First create a doc
    const initialData = {
      name: 'Existing Doc',
      content: 'Initial content',
      type: 'normal' as const,
      organizationId: testOrgId,
    };

    const created = await upsertDoc(initialData);
    testDocIds.push(created.id);

    // Now upsert with same name and org
    const updatedData = {
      name: 'Existing Doc',
      content: 'Updated content',
      type: 'analyst' as const,
      organizationId: testOrgId,
    };

    const updated = await upsertDoc(updatedData);

    expect(updated.id).toBe(created.id); // Same doc
    expect(updated.content).toBe('Updated content');
    expect(updated.type).toBe('analyst');
    expect(updated.deletedAt).toBeNull();
  });

  it('should unmark soft deleted doc on upsert', async () => {
    // Create and soft delete a doc
    const docData = {
      name: 'Deleted Doc',
      content: 'Original content',
      type: 'normal' as const,
      organizationId: testOrgId,
    };

    const created = await upsertDoc(docData);
    testDocIds.push(created.id);

    // Soft delete it
    await db
      .update(docs)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(docs.id, created.id));

    // Upsert with same name and org
    const restored = await upsertDoc({
      ...docData,
      content: 'Restored content',
    });

    expect(restored.id).toBe(created.id);
    expect(restored.deletedAt).toBeNull(); // Unmarked
    expect(restored.content).toBe('Restored content');
  });

  it('should validate input with Zod schema', async () => {
    const invalidData = {
      name: '', // Empty name should fail
      content: 'Test content',
      // @ts-expect-error Testing invalid type
      type: 'invalid', // Invalid type
      organizationId: 'not-a-uuid',
    };

    await expect(upsertDoc(invalidData)).rejects.toThrow();
  });

  it('should create different docs for different organizations', async () => {
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

    const docName = 'Same Name Doc';

    // Create doc in first org
    const doc1 = await upsertDoc({
      name: docName,
      content: 'Org 1 content',
      type: 'normal' as const,
      organizationId: testOrgId,
    });
    testDocIds.push(doc1.id);

    // Create doc with same name in second org
    const doc2 = await upsertDoc({
      name: docName,
      content: 'Org 2 content',
      type: 'analyst' as const,
      organizationId: org2.id,
    });
    testDocIds.push(doc2.id);

    expect(doc1.id).not.toBe(doc2.id);
    expect(doc1.content).toBe('Org 1 content');
    expect(doc2.content).toBe('Org 2 content');

    // Clean up second org
    await db.delete(organizations).where(eq(organizations.id, org2.id));
  });
});
