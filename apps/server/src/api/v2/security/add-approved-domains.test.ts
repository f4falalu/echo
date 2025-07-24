import { db } from '@buster/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addApprovedDomainsHandler } from './add-approved-domains';
import { DomainService } from './domain-service';
import * as securityUtils from './security-utils';
import { createTestOrganization, createTestUser } from './test-fixtures';

// Mock dependencies
vi.mock('./security-utils');
vi.mock('./domain-service', () => {
  const DomainService = vi.fn();
  DomainService.prototype.mergeDomains = vi.fn();
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

describe('addApprovedDomainsHandler', () => {
  const mockUser = createTestUser();
  const mockOrg = createTestOrganization({
    id: 'org-123',
    domains: ['existing.com'],
  });
  const mockOrgMembership = { organizationId: 'org-123', role: 'workspace_admin' as const };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(securityUtils.validateUserOrganization).mockResolvedValue(mockOrgMembership);
    vi.mocked(securityUtils.checkAdminPermissions).mockImplementation(() => {});
    vi.mocked(securityUtils.fetchOrganization).mockResolvedValue(mockOrg);

    // Setup domain service mocks
    vi.mocked(DomainService.prototype.mergeDomains).mockReturnValue(['existing.com', 'new.com']);
    vi.mocked(DomainService.prototype.formatDomainsResponse).mockReturnValue([
      { domain: 'existing.com', created_at: mockOrg.createdAt },
      { domain: 'new.com', created_at: mockOrg.createdAt },
    ]);

    // Mock database update
    const mockDbChain = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(db.update).mockReturnValue(mockDbChain as any);
  });

  it('should add new domains successfully', async () => {
    const request = { domains: ['new.com'] };

    const result = await addApprovedDomainsHandler(request, mockUser);

    expect(securityUtils.validateUserOrganization).toHaveBeenCalledWith(mockUser.id);
    expect(securityUtils.checkAdminPermissions).toHaveBeenCalledWith('workspace_admin');
    expect(securityUtils.fetchOrganization).toHaveBeenCalledWith('org-123');

    expect(DomainService.prototype.mergeDomains).toHaveBeenCalledWith(
      ['existing.com'],
      ['new.com']
    );
    expect(DomainService.prototype.formatDomainsResponse).toHaveBeenCalledWith(
      ['existing.com', 'new.com'],
      mockOrg.createdAt
    );

    expect(result).toEqual([
      { domain: 'existing.com', created_at: mockOrg.createdAt },
      { domain: 'new.com', created_at: mockOrg.createdAt },
    ]);
  });

  it('should handle empty existing domains', async () => {
    const orgWithNoDomains = { ...mockOrg, domains: null };
    vi.mocked(securityUtils.fetchOrganization).mockResolvedValue(orgWithNoDomains);

    vi.mocked(DomainService.prototype.mergeDomains).mockReturnValue(['new.com']);
    vi.mocked(DomainService.prototype.formatDomainsResponse).mockReturnValue([
      { domain: 'new.com', created_at: mockOrg.createdAt },
    ]);

    const request = { domains: ['new.com'] };
    const result = await addApprovedDomainsHandler(request, mockUser);

    expect(DomainService.prototype.mergeDomains).toHaveBeenCalledWith([], ['new.com']);
    expect(result).toEqual([{ domain: 'new.com', created_at: mockOrg.createdAt }]);
  });

  it('should update database with new domains', async () => {
    const request = { domains: ['new.com'] };
    const mockDbChain = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(db.update).mockReturnValue(mockDbChain as any);

    await addApprovedDomainsHandler(request, mockUser);

    expect(db.update).toHaveBeenCalled();
    expect(mockDbChain.set).toHaveBeenCalledWith({
      domains: ['existing.com', 'new.com'],
      updatedAt: expect.any(String),
    });
  });

  it('should handle validation errors', async () => {
    vi.mocked(securityUtils.validateUserOrganization).mockRejectedValue(
      new Error('User not in organization')
    );

    const request = { domains: ['new.com'] };

    await expect(addApprovedDomainsHandler(request, mockUser)).rejects.toThrow(
      'User not in organization'
    );
  });

  it('should handle permission errors', async () => {
    vi.mocked(securityUtils.checkAdminPermissions).mockImplementation(() => {
      throw new Error('Insufficient permissions');
    });

    const request = { domains: ['new.com'] };

    await expect(addApprovedDomainsHandler(request, mockUser)).rejects.toThrow(
      'Insufficient permissions'
    );
  });
});
