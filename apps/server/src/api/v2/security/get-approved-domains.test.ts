import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getApprovedDomainsHandler } from './get-approved-domains';
import { createTestUser, createTestOrganization } from './test-fixtures';
import * as securityUtils from './security-utils';
import { DomainService } from './domain-service';

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
  const mockOrgMembership = { organizationId: 'org-123', role: 'member' };
  
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
    
    expect(DomainService.prototype.formatDomainsResponse).toHaveBeenCalledWith(null, mockOrg.createdAt);
    expect(result).toEqual([]);
  });

  it('should handle validation errors', async () => {
    vi.mocked(securityUtils.validateUserOrganization).mockRejectedValue(
      new Error('User not in organization')
    );
    
    await expect(getApprovedDomainsHandler(mockUser)).rejects.toThrow(
      'User not in organization'
    );
  });

  it('should handle organization fetch errors', async () => {
    vi.mocked(securityUtils.fetchOrganization).mockRejectedValue(
      new Error('Organization not found')
    );
    
    await expect(getApprovedDomainsHandler(mockUser)).rejects.toThrow(
      'Organization not found'
    );
  });

  it('should not require admin permissions', async () => {
    // Test with non-admin role
    const nonAdminMembership = { organizationId: 'org-123', role: 'member' };
    vi.mocked(securityUtils.validateUserOrganization).mockResolvedValue(nonAdminMembership);
    
    const result = await getApprovedDomainsHandler(mockUser);
    
    // Should still succeed
    expect(result).toEqual([
      { domain: 'example.com', created_at: mockOrg.createdAt },
      { domain: 'test.io', created_at: mockOrg.createdAt },
    ]);
  });
});