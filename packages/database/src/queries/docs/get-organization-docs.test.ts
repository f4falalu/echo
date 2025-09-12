import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetOrganizationDocsParamsSchema, getOrganizationDocs } from './get-organization-docs';

// Mock the database connection and schema
vi.mock('../../connection', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(),
        })),
      })),
    })),
  },
}));

vi.mock('../../schema', () => ({
  docs: {
    id: 'id',
    name: 'name',
    content: 'content',
    type: 'type',
    updatedAt: 'updatedAt',
    organizationId: 'organizationId',
    deletedAt: 'deletedAt',
  },
}));

// Mock drizzle-orm functions
vi.mock('drizzle-orm', () => ({
  and: vi.fn((...conditions) => ({ type: 'and', conditions })),
  eq: vi.fn((column, value) => ({ type: 'eq', column, value })),
  ne: vi.fn((column, value) => ({ type: 'ne', column, value })),
  isNull: vi.fn((column) => ({ type: 'isNull', column })),
}));

import { db } from '../../connection';

const mockDb = vi.mocked(db);

describe('GetOrganizationDocsParamsSchema', () => {
  it('should validate valid UUID organization ID', () => {
    const validParams = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = GetOrganizationDocsParamsSchema.safeParse(validParams);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.organizationId).toBe(validParams.organizationId);
    }
  });

  it('should reject invalid UUID format', () => {
    const invalidParams = {
      organizationId: 'not-a-valid-uuid',
    };

    const result = GetOrganizationDocsParamsSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject missing organization ID', () => {
    const emptyParams = {};

    const result = GetOrganizationDocsParamsSchema.safeParse(emptyParams);
    expect(result.success).toBe(false);
  });

  it('should reject non-string organization ID', () => {
    const invalidParams = {
      organizationId: 123,
    };

    const result = GetOrganizationDocsParamsSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });
});

describe('getOrganizationDocs', () => {
  const validParams = {
    organizationId: '123e4567-e89b-12d3-a456-426614174000',
  };

  let mockSelect: any;
  let mockFrom: any;
  let mockWhere: any;
  let mockOrderBy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockOrderBy = vi.fn().mockResolvedValue([]);
    mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
    mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
    mockDb.select = mockSelect;
  });

  it('should validate params before database query', async () => {
    const invalidParams = {
      organizationId: 'invalid-uuid',
    };

    await expect(getOrganizationDocs(invalidParams)).rejects.toThrow();
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('should return organization docs when found', async () => {
    const mockResults = [
      {
        id: 'doc-1',
        name: 'README.md',
        content: '# Project Documentation',
        type: 'normal',
        updatedAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'doc-2',
        name: 'api-guide.md',
        content: '# API Guide',
        type: 'normal',
        updatedAt: '2023-01-02T00:00:00Z',
      },
    ];
    mockOrderBy.mockResolvedValue(mockResults);

    const result = await getOrganizationDocs(validParams);

    expect(mockSelect).toHaveBeenCalledWith({
      id: expect.any(String),
      name: expect.any(String),
      content: expect.any(String),
      type: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(mockFrom).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
    expect(mockOrderBy).toHaveBeenCalled();
    expect(result).toEqual(mockResults);
  });

  it('should return empty array when no docs found', async () => {
    mockOrderBy.mockResolvedValue([]);

    const result = await getOrganizationDocs(validParams);

    expect(result).toEqual([]);
  });

  it('should use correct database query conditions', async () => {
    await getOrganizationDocs(validParams);

    // Verify the query was constructed with correct conditions
    expect(mockSelect).toHaveBeenCalledWith({
      id: expect.any(String),
      name: expect.any(String),
      content: expect.any(String),
      type: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(mockFrom).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'and',
        conditions: expect.arrayContaining([
          expect.objectContaining({ type: 'eq' }), // organizationId condition
          expect.objectContaining({ type: 'eq' }), // type = 'normal' condition
          expect.objectContaining({ type: 'isNull' }), // not deleted condition
        ]),
      })
    );
    expect(mockOrderBy).toHaveBeenCalled();
  });

  it('should handle database errors', async () => {
    mockOrderBy.mockRejectedValue(new Error('Database query failed'));

    await expect(getOrganizationDocs(validParams)).rejects.toThrow('Database query failed');
  });

  it('should filter for normal type docs only', async () => {
    // This test verifies the query construction filters for type = 'normal'
    // since that happens at the database level
    await getOrganizationDocs(validParams);

    expect(mockWhere).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'and',
        conditions: expect.arrayContaining([
          expect.objectContaining({ type: 'eq' }), // Should have eq condition for normal type
        ]),
      })
    );
  });

  it('should order results by name', async () => {
    await getOrganizationDocs(validParams);

    expect(mockOrderBy).toHaveBeenCalledWith(expect.any(String)); // docs.name
  });

  it('should handle large result sets', async () => {
    const largeResults = Array.from({ length: 100 }, (_, i) => ({
      id: `doc-${i}`,
      name: `doc-${i}.md`,
      content: `# Document ${i}`,
      type: 'normal',
      updatedAt: `2023-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
    }));
    mockOrderBy.mockResolvedValue(largeResults);

    const result = await getOrganizationDocs(validParams);

    expect(result).toEqual(largeResults);
    expect(result).toHaveLength(100);
  });

  it('should handle docs with different content types', async () => {
    const diverseResults = [
      {
        id: 'doc-1',
        name: 'empty.md',
        content: '',
        type: 'normal',
        updatedAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'doc-2',
        name: 'long.md',
        content: 'A'.repeat(10000),
        type: 'normal',
        updatedAt: '2023-01-02T00:00:00Z',
      },
      {
        id: 'doc-3',
        name: 'special-chars.md',
        content: '# Special\n\n```sql\nSELECT * FROM "users";\n```\n\n- 中文\n- العربية',
        type: 'normal',
        updatedAt: '2023-01-03T00:00:00Z',
      },
    ];
    mockOrderBy.mockResolvedValue(diverseResults);

    const result = await getOrganizationDocs(validParams);

    expect(result).toEqual(diverseResults);
  });

  it('should handle null and undefined values in results', async () => {
    const resultsWithNulls = [
      {
        id: 'doc-1',
        name: 'test.md',
        content: '# Test',
        type: 'normal',
        updatedAt: null, // null value
      },
      {
        id: 'doc-2',
        name: 'another.md',
        content: '',
        type: 'normal',
        updatedAt: '2023-01-01T00:00:00Z',
      },
    ];
    mockOrderBy.mockResolvedValue(resultsWithNulls);

    const result = await getOrganizationDocs(validParams);

    expect(result).toEqual(resultsWithNulls);
  });

  it('should return consistent ordering', async () => {
    // This test ensures that the orderBy is called with the name column
    // The actual ordering is handled by the database
    await getOrganizationDocs(validParams);

    expect(mockOrderBy).toHaveBeenCalledWith(expect.any(String)); // docs.name
  });
});
