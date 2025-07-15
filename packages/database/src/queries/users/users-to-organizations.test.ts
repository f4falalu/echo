import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getUserOrganizationId } from '../organizations/organizations';
import { getUserToOrganization } from './users-to-organizations';

// Mock the organizations module
vi.mock('../organizations/organizations', () => ({
  getUserOrganizationId: vi.fn(),
}));

// Mock the database connection
vi.mock('../../connection', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
  },
}));

describe('getUserToOrganization', () => {
  const mockGetUserOrganizationId = vi.mocked(getUserOrganizationId);

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

    const { db } = await import('../../connection');
    const mockDb = vi.mocked(db);

    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockUsers),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);

    // Act
    const result = await getUserToOrganization({
      userId: '123e4567-e89b-12d3-a456-426614174000',
    });

    // Assert
    expect(result).toEqual(mockUsers);
    expect(mockGetUserOrganizationId).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
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

    const { db } = await import('../../connection');
    const mockDb = vi.mocked(db);

    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockUsers),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);

    // Act
    const result = await getUserToOrganization({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      filters: { userName: 'John' },
    });

    // Assert
    expect(result).toEqual(mockUsers);
    expect(mockGetUserOrganizationId).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
  });

  test('should validate input with invalid UUID', async () => {
    // Act & Assert
    await expect(getUserToOrganization({ userId: 'invalid-uuid' })).rejects.toThrow(
      'User ID must be a valid UUID'
    );
  });
});
