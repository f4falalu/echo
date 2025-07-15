import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getUserOrganizationId } from '../organizations/organizations';
import { withPaginationMeta } from '../shared-types';
import { getUserToOrganization } from './users-to-organizations';

// Mock the organizations module
vi.mock('../organizations/organizations', () => ({
  getUserOrganizationId: vi.fn(),
}));

// Mock the shared-types module
vi.mock('../shared-types', () => ({
  withPaginationMeta: vi.fn(),
}));

// Mock the database connection
vi.mock('../../connection', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            $dynamic: vi.fn(() => 'mock-dynamic-query'),
          })),
        })),
      })),
    })),
  },
}));

describe('getUserToOrganization', () => {
  const mockGetUserOrganizationId = vi.mocked(getUserOrganizationId);
  const mockWithPaginationMeta = vi.mocked(withPaginationMeta);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should throw error when user is not found in any organization', async () => {
    // Arrange
    mockGetUserOrganizationId.mockResolvedValue(null);

    // Act & Assert
    await expect(
      getUserToOrganization({ userId: '123e4567-e89b-12d3-a456-426614174000' })
    ).rejects.toThrow('User not found in any organization');
  });

  test('should return users in the same organization without filters', async () => {
    // Arrange
    const mockUsers = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        avatarUrl: null,
        role: 'querier',
        status: 'active',
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Jane Smith',
        email: 'jane@example.com',
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'workspace_admin',
        status: 'active',
      },
    ];

    mockGetUserOrganizationId.mockResolvedValue({
      organizationId: 'org-123',
      role: 'querier',
    });

    // Mock withPaginationMeta to return the expected structure
    mockWithPaginationMeta.mockResolvedValue({
      data: mockUsers,
      pagination: {
        page: 1,
        page_size: 250,
        total: 2,
        total_pages: 1,
      },
    });

    // Act
    const result = await getUserToOrganization({
      userId: '123e4567-e89b-12d3-a456-426614174000',
    });

    // Assert
    expect(result).toEqual({
      users: mockUsers,
      pagination: {
        page: 1,
        page_size: 250,
        total: 2,
        total_pages: 1,
      },
    });
    expect(mockGetUserOrganizationId).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    expect(mockWithPaginationMeta).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'mock-dynamic-query',
        orderBy: expect.anything(),
        page: 1,
        page_size: 250,
        countFrom: expect.objectContaining({
          // Just check that it has a table name symbol
          [Symbol.for('drizzle:Name')]: expect.any(String),
        }),
      })
    );
  });

  test('should apply userName filter when provided', async () => {
    // Arrange
    const mockUsers = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        avatarUrl: null,
        role: 'querier',
        status: 'active',
      },
    ];

    mockGetUserOrganizationId.mockResolvedValue({
      organizationId: 'org-123',
      role: 'querier',
    });

    mockWithPaginationMeta.mockResolvedValue({
      data: mockUsers,
      pagination: {
        page: 1,
        page_size: 250,
        total: 1,
        total_pages: 1,
      },
    });

    // Act
    const result = await getUserToOrganization({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      filters: { userName: 'John' },
    });

    // Assert
    expect(result).toEqual({
      users: mockUsers,
      pagination: {
        page: 1,
        page_size: 250,
        total: 1,
        total_pages: 1,
      },
    });
    expect(mockGetUserOrganizationId).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    expect(mockWithPaginationMeta).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'mock-dynamic-query',
        orderBy: expect.anything(),
        page: 1,
        page_size: 250,
        countFrom: expect.objectContaining({
          [Symbol.for('drizzle:Name')]: expect.any(String),
        }),
        countWhere: expect.anything(),
      })
    );
  });

  test('should handle pagination correctly', async () => {
    // Arrange
    const mockUsers = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        avatarUrl: null,
        role: 'querier',
        status: 'active',
      },
    ];

    mockGetUserOrganizationId.mockResolvedValue({
      organizationId: 'org-123',
      role: 'querier',
    });

    mockWithPaginationMeta.mockResolvedValue({
      data: mockUsers,
      pagination: {
        page: 2,
        page_size: 10,
        total: 100,
        total_pages: 10,
      },
    });

    // Act
    const result = await getUserToOrganization({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      page: 2,
      page_size: 10,
    });

    // Assert
    expect(result).toEqual({
      users: mockUsers,
      pagination: {
        page: 2,
        page_size: 10,
        total: 100,
        total_pages: 10,
      },
    });
    expect(mockGetUserOrganizationId).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    expect(mockWithPaginationMeta).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'mock-dynamic-query',
        orderBy: expect.anything(),
        page: 2,
        page_size: 10,
        countFrom: expect.objectContaining({
          [Symbol.for('drizzle:Name')]: expect.any(String),
        }),
      })
    );
  });

  test('should validate input with invalid UUID', async () => {
    // Act & Assert
    await expect(getUserToOrganization({ userId: 'invalid-uuid' })).rejects.toThrow(
      'User ID must be a valid UUID'
    );
  });
});
