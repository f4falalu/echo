import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpsertDocSchema, upsertDoc } from './upsert-doc';

// Mock the database connection and schema
vi.mock('../../connection', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoUpdate: vi.fn(() => ({
          returning: vi.fn(),
        })),
      })),
    })),
  },
}));

vi.mock('../../schema', () => ({
  docs: {
    name: 'name',
    organizationId: 'organizationId',
    content: 'content',
    type: 'type',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt',
  },
}));

import { db } from '../../connection';

const mockDb = vi.mocked(db);

describe('UpsertDocSchema', () => {
  it('should validate complete doc params', () => {
    const validParams = {
      name: 'README.md',
      content: '# Documentation\nThis is documentation content',
      type: 'normal' as const,
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = UpsertDocSchema.safeParse(validParams);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validParams);
    }
  });

  it('should validate analyst doc type', () => {
    const analystParams = {
      name: 'ANALYST.md',
      content: '# Analyst Guide\nInstructions for analysts',
      type: 'analyst' as const,
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = UpsertDocSchema.safeParse(analystParams);
    expect(result.success).toBe(true);
  });

  it('should reject invalid doc type', () => {
    const invalidParams = {
      name: 'test.md',
      content: 'content',
      type: 'invalid_type',
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = UpsertDocSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject empty name', () => {
    const invalidParams = {
      name: '',
      content: 'content',
      type: 'normal' as const,
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = UpsertDocSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject name longer than 255 characters', () => {
    const invalidParams = {
      name: 'a'.repeat(256), // 256 characters, exceeds limit
      content: 'content',
      type: 'normal' as const,
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = UpsertDocSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject invalid UUID organization ID', () => {
    const invalidParams = {
      name: 'test.md',
      content: 'content',
      type: 'normal' as const,
      organizationId: 'not-a-valid-uuid',
    };

    const result = UpsertDocSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should require all fields', () => {
    const incompleteParams = {
      name: 'test.md',
      // missing content, type, organizationId
    };

    const result = UpsertDocSchema.safeParse(incompleteParams);
    expect(result.success).toBe(false);
  });
});

describe('upsertDoc', () => {
  const validParams = {
    name: 'test.md',
    content: '# Test\nContent',
    type: 'normal' as const,
    organizationId: '123e4567-e89b-12d3-a456-426614174000',
  };

  let mockInsert: ReturnType<typeof vi.fn>;
  let mockValues: ReturnType<typeof vi.fn>;
  let mockOnConflictDoUpdate: ReturnType<typeof vi.fn>;
  let mockReturning: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReturning = vi.fn().mockResolvedValue([{ id: 'doc-123', ...validParams }]);
    mockOnConflictDoUpdate = vi.fn().mockReturnValue({ returning: mockReturning });
    mockValues = vi.fn().mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
    mockInsert = vi.fn().mockReturnValue({ values: mockValues });
    mockDb.insert = mockInsert;
  });

  it('should validate params before database operation', async () => {
    const invalidParams = {
      name: '', // invalid
      content: 'content',
      type: 'normal' as const,
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    await expect(upsertDoc(invalidParams)).rejects.toThrow();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('should successfully upsert valid doc', async () => {
    const result = await upsertDoc(validParams);

    expect(mockInsert).toHaveBeenCalledWith(expect.any(Object));
    expect(mockValues).toHaveBeenCalledWith({
      name: validParams.name,
      content: validParams.content,
      type: validParams.type,
      organizationId: validParams.organizationId,
      updatedAt: expect.any(String),
    });
    expect(mockOnConflictDoUpdate).toHaveBeenCalledWith({
      target: expect.any(Array), // docs.name, docs.organizationId
      set: {
        content: validParams.content,
        type: validParams.type,
        updatedAt: expect.any(String),
        deletedAt: null, // Should unmark soft delete
      },
    });
    expect(result).toEqual({ id: 'doc-123', ...validParams });
  });

  it('should handle database errors', async () => {
    mockReturning.mockRejectedValue(new Error('Database connection failed'));

    // Mock console.error to avoid test noise
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(upsertDoc(validParams)).rejects.toThrow('Failed to upsert doc');
    expect(consoleSpy).toHaveBeenCalledWith('Error upserting doc:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('should handle analyst doc type correctly', async () => {
    const analystParams = {
      ...validParams,
      name: 'ANALYST.md',
      type: 'analyst' as const,
    };

    await upsertDoc(analystParams);

    expect(mockValues).toHaveBeenCalledWith({
      name: 'ANALYST.md',
      content: analystParams.content,
      type: 'analyst',
      organizationId: analystParams.organizationId,
      updatedAt: expect.any(String),
    });
  });

  it('should set correct conflict resolution', async () => {
    await upsertDoc(validParams);

    expect(mockOnConflictDoUpdate).toHaveBeenCalledWith({
      target: expect.any(Array), // Should target name and organizationId
      set: {
        content: validParams.content,
        type: validParams.type,
        updatedAt: expect.any(String),
        deletedAt: null, // Important: should unmark soft delete
      },
    });
  });
});
