import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../connection';
import { docs, organizations } from '../../schema';
import { listDocs } from './list-docs';

describe('listDocs', () => {
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

    // Create test docs
    const docsToCreate = [
      { name: 'Alpha Doc', content: 'Content 1', type: 'normal' as const },
      { name: 'Beta Doc', content: 'Content 2', type: 'analyst' as const },
      { name: 'Gamma Doc', content: 'Content 3', type: 'normal' as const },
      { name: 'Delta Doc', content: 'Content 4', type: 'analyst' as const },
      { name: 'Epsilon Doc', content: 'Content 5', type: 'normal' as const },
    ];

    for (const docData of docsToCreate) {
      const [doc] = await db
        .insert(docs)
        .values({
          id: randomUUID(),
          name: docData.name,
          content: docData.content,
          type: docData.type,
          organizationId: testOrgId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();
      testDocIds.push(doc.id);
    }
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

  it('should list all docs for organization', async () => {
    const result = await listDocs({
      organizationId: testOrgId,
    });

    expect(result.data).toHaveLength(5);
    expect(result.total).toBe(5);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('should filter by type', async () => {
    const result = await listDocs({
      organizationId: testOrgId,
      type: 'analyst',
    });

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.data.every((doc) => doc.type === 'analyst')).toBe(true);
  });

  it('should search by name', async () => {
    const result = await listDocs({
      organizationId: testOrgId,
      search: 'Beta',
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('Beta Doc');
  });

  it('should paginate results', async () => {
    const page1 = await listDocs({
      organizationId: testOrgId,
      page: 1,
      pageSize: 2,
    });

    expect(page1.data).toHaveLength(2);
    expect(page1.page).toBe(1);
    expect(page1.totalPages).toBe(3);

    const page2 = await listDocs({
      organizationId: testOrgId,
      page: 2,
      pageSize: 2,
    });

    expect(page2.data).toHaveLength(2);
    expect(page2.page).toBe(2);

    // Ensure different docs on different pages
    const page1Ids = page1.data.map((d) => d.id);
    const page2Ids = page2.data.map((d) => d.id);
    expect(page1Ids).not.toEqual(page2Ids);
  });

  it('should not return soft deleted docs', async () => {
    // Soft delete one doc
    await db
      .update(docs)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(docs.id, testDocIds[0]));

    const result = await listDocs({
      organizationId: testOrgId,
    });

    expect(result.data).toHaveLength(4);
    expect(result.total).toBe(4);
    expect(result.data.find((d) => d.id === testDocIds[0])).toBeUndefined();
  });

  it('should not return docs from other organizations', async () => {
    // Create another org with docs
    const [org2] = await db
      .insert(organizations)
      .values({
        id: randomUUID(),
        name: `Test Org 2 ${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    const [otherDoc] = await db
      .insert(docs)
      .values({
        id: randomUUID(),
        name: 'Other Org Doc',
        content: 'Other content',
        type: 'normal',
        organizationId: org2.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    const result = await listDocs({
      organizationId: testOrgId,
    });

    expect(result.data.find((d) => d.id === otherDoc.id)).toBeUndefined();
    expect(result.total).toBe(5);

    // Clean up
    await db.delete(docs).where(eq(docs.id, otherDoc.id));
    await db.delete(organizations).where(eq(organizations.id, org2.id));
  });

  it('should validate input with Zod schema', async () => {
    const invalidData = {
      organizationId: 'not-a-uuid',
      page: -1,
      pageSize: 1000,
    };

    // @ts-expect-error Testing invalid input
    await expect(listDocs(invalidData)).rejects.toThrow();
  });
});
