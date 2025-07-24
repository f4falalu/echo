import { db } from '@buster/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainService } from './domain-service';
import { removeApprovedDomainsHandler } from './remove-approved-domains';
import * as securityUtils from './security-utils';
import { createTestOrganization, createTestUser } from './test-fixtures';

// Mock dependencies
vi.mock('./security-utils');
vi.mock('./domain-service', () => {
  const DomainService = vi.fn();
  DomainService.prototype.filterDomains = vi.fn();
  DomainService.prototype.formatDomainsResponse = vi.fn();
  return { DomainService };
});
vi.mock('@buster/database', () => ({
  db: {
    update: vi.fn(),
    set: vi.fn(),
    where: vi.fn(),
  },
  organizations: {},
  eq: vi.fn(),
  and: vi.fn(),
  isNull: vi.fn(),
}));

describe('removeApprovedDomainsHandler', () => {
  const mockUser = createTestUser();
  const mockOrg = createTestOrganization({
    id: 'org-123',
    domains: ['example.com', 'test.io', 'keep.com'],
  });
  const mockOrgMembership = { organizationId: 'org-123', role: 'workspace_admin' as const };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(securityUtils.validateUserOrganization).mockResolvedValue(mockOrgMembership);
    vi.mocked(securityUtils.checkAdminPermissions).mockImplementation(() => {});
    vi.mocked(securityUtils.fetchOrganization).mockResolvedValue(mockOrg);

    // Setup domain service mocks
    vi.mocked(DomainService.prototype.filterDomains).mockReturnValue(['keep.com']);
    vi.mocked(DomainService.prototype.formatDomainsResponse).mockReturnValue([
      { domain: 'keep.com', created_at: mockOrg.createdAt },
    ]);

    // Mock database update
    const mockDbChain = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(db.update).mockReturnValue(mockDbChain as any);
  });

  it('should remove specified domains', async () => {
    const request = { domains: ['example.com', 'test.io'] };

    const result = await removeApprovedDomainsHandler(request, mockUser);

    expect(securityUtils.validateUserOrganization).toHaveBeenCalledWith(mockUser.id);
    expect(securityUtils.checkAdminPermissions).toHaveBeenCalledWith('workspace_admin');
    expect(securityUtils.fetchOrganization).toHaveBeenCalledWith('org-123');

    expect(DomainService.prototype.filterDomains).toHaveBeenCalledWith(
      ['example.com', 'test.io', 'keep.com'],
      ['example.com', 'test.io']
    );
    expect(DomainService.prototype.formatDomainsResponse).toHaveBeenCalledWith(
      ['keep.com'],
      mockOrg.createdAt
    );

    expect(result).toEqual([{ domain: 'keep.com', created_at: mockOrg.createdAt }]);
  });

  it('should handle non-existent domain removal gracefully', async () => {
    vi.mocked(DomainService.prototype.filterDomains).mockReturnValue([
      'example.com',
      'test.io',
      'keep.com',
    ]);
    vi.mocked(DomainService.prototype.formatDomainsResponse).mockReturnValue([
      { domain: 'example.com', created_at: mockOrg.createdAt },
      { domain: 'test.io', created_at: mockOrg.createdAt },
      { domain: 'keep.com', created_at: mockOrg.createdAt },
    ]);

    const request = { domains: ['notfound.com'] };
    const result = await removeApprovedDomainsHandler(request, mockUser);

    expect(DomainService.prototype.filterDomains).toHaveBeenCalledWith(
      ['example.com', 'test.io', 'keep.com'],
      ['notfound.com']
    );
    expect(result).toHaveLength(3); // All domains remain
  });

  it('should update database with filtered domains', async () => {
    const request = { domains: ['example.com'] };
    const mockDbChain = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(db.update).mockReturnValue(mockDbChain as any);

    await removeApprovedDomainsHandler(request, mockUser);

    expect(db.update).toHaveBeenCalled();
    expect(mockDbChain.set).toHaveBeenCalledWith({
      domains: ['keep.com'],
      updatedAt: expect.any(String),
    });
  });

  it('should handle empty domains array', async () => {
    const orgWithNoDomains = { ...mockOrg, domains: null };
    vi.mocked(securityUtils.fetchOrganization).mockResolvedValue(orgWithNoDomains);

    vi.mocked(DomainService.prototype.filterDomains).mockReturnValue([]);
    vi.mocked(DomainService.prototype.formatDomainsResponse).mockReturnValue([]);

    const request = { domains: ['example.com'] };
    const result = await removeApprovedDomainsHandler(request, mockUser);

    expect(DomainService.prototype.filterDomains).toHaveBeenCalledWith([], ['example.com']);
    expect(result).toEqual([]);
  });

  it('should handle validation errors', async () => {
    vi.mocked(securityUtils.validateUserOrganization).mockRejectedValue(
      new Error('User not in organization')
    );

    const request = { domains: ['example.com'] };

    await expect(removeApprovedDomainsHandler(request, mockUser)).rejects.toThrow(
      'User not in organization'
    );
  });

  it('should handle permission errors', async () => {
    vi.mocked(securityUtils.checkAdminPermissions).mockImplementation(() => {
      throw new Error('Insufficient permissions');
    });

    const request = { domains: ['example.com'] };

    await expect(removeApprovedDomainsHandler(request, mockUser)).rejects.toThrow(
      'Insufficient permissions'
    );
  });
});
