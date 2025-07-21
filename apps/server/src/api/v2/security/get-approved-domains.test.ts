// Mock database before any imports that might use it
vi.mock('@buster/database', () => ({
  getUserOrganizationId: vi.fn(),
  db: {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  },
  organizations: {},
  datasets: {},
  datasetsToPermissionGroups: {},
  permissionGroups: {},
  eq: vi.fn(),
  and: vi.fn(),
  isNull: vi.fn(),
}));

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainService } from './domain-service';
import { getApprovedDomainsHandler } from './get-approved-domains';
import * as securityUtils from './security-utils';
import { createTestOrganization, createTestUser } from './test-fixtures';

// Mock dependencies
vi.mock('./security-utils');
vi.mock('./domain-service', () => {
  const DomainService = vi.fn();
  DomainService.prototype.formatDomainsResponse = vi.fn();
  return { DomainService };
});

describe('getApprovedDomainsHandler', () => {
  const mockUser = createTestUser();
  const mockOrg = createTestOrganization({
    id: 'org-123',
    domains: ['example.com', 'test.io'],
  });
  const mockOrgMembership = { organizationId: 'org-123', role: 'querier' as const };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(securityUtils.validateUserOrganization).mockResolvedValue(mockOrgMembership);
    vi.mocked(securityUtils.fetchOrganization).mockResolvedValue(mockOrg);

    // Setup domain service mocks
    vi.mocked(DomainService.prototype.formatDomainsResponse).mockReturnValue([
      { domain: 'example.com', created_at: mockOrg.createdAt },
      { domain: 'test.io', created_at: mockOrg.createdAt },
    ]);
  });

  it('should return domains for valid organization', async () => {
    const result = await getApprovedDomainsHandler(mockUser);

    expect(securityUtils.validateUserOrganization).toHaveBeenCalledWith(mockUser.id);
    expect(securityUtils.fetchOrganization).toHaveBeenCalledWith('org-123');

    expect(DomainService.prototype.formatDomainsResponse).toHaveBeenCalledWith(
      ['example.com', 'test.io'],
      mockOrg.createdAt
    );

    expect(result).toEqual([
      { domain: 'example.com', created_at: mockOrg.createdAt },
      { domain: 'test.io', created_at: mockOrg.createdAt },
    ]);
  });

  it('should return empty array for org with no domains', async () => {
    const orgWithNoDomains = { ...mockOrg, domains: null };
    vi.mocked(securityUtils.fetchOrganization).mockResolvedValue(orgWithNoDomains);

    vi.mocked(DomainService.prototype.formatDomainsResponse).mockReturnValue([]);

    const result = await getApprovedDomainsHandler(mockUser);

    expect(DomainService.prototype.formatDomainsResponse).toHaveBeenCalledWith(
      null,
      mockOrg.createdAt
    );
    expect(result).toEqual([]);
  });

  it('should return empty array for org with empty domains array', async () => {
    const orgWithEmptyDomains = { ...mockOrg, domains: [] };
    vi.mocked(securityUtils.fetchOrganization).mockResolvedValue(orgWithEmptyDomains);

    vi.mocked(DomainService.prototype.formatDomainsResponse).mockReturnValue([]);

    const result = await getApprovedDomainsHandler(mockUser);

    expect(DomainService.prototype.formatDomainsResponse).toHaveBeenCalledWith(
      [],
      mockOrg.createdAt
    );
    expect(result).toEqual([]);
  });

  it('should handle validation errors', async () => {
    vi.mocked(securityUtils.validateUserOrganization).mockRejectedValue(
      new Error('User not in organization')
    );

    await expect(getApprovedDomainsHandler(mockUser)).rejects.toThrow('User not in organization');
  });

  it('should handle organization fetch errors', async () => {
    vi.mocked(securityUtils.fetchOrganization).mockRejectedValue(
      new Error('Organization not found')
    );

    await expect(getApprovedDomainsHandler(mockUser)).rejects.toThrow('Organization not found');
  });

  it('should not require admin permissions', async () => {
    // Test with non-admin role
    const nonAdminMembership = { organizationId: 'org-123', role: 'querier' as const };
    vi.mocked(securityUtils.validateUserOrganization).mockResolvedValue(nonAdminMembership);

    const result = await getApprovedDomainsHandler(mockUser);

    // Should still succeed
    expect(result).toEqual([
      { domain: 'example.com', created_at: mockOrg.createdAt },
      { domain: 'test.io', created_at: mockOrg.createdAt },
    ]);
  });
});
