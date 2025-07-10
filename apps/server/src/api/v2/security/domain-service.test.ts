import { describe, it, expect } from 'vitest';
import { DomainService } from './domain-service';

describe('DomainService', () => {
  const service = new DomainService();

  describe('normalizeDomains', () => {
    it('should normalize domains to lowercase', () => {
      const result = service.normalizeDomains(['Example.COM', 'TEST.io']);
      expect(result).toEqual(['example.com', 'test.io']);
    });

    it('should trim whitespace from domains', () => {
      const result = service.normalizeDomains(['  example.com  ', '\ttest.io\n']);
      expect(result).toEqual(['example.com', 'test.io']);
    });

    it('should handle empty domain arrays', () => {
      const result = service.normalizeDomains([]);
      expect(result).toEqual([]);
    });

    it('should preserve valid domains', () => {
      const result = service.normalizeDomains(['example.com', 'test.io']);
      expect(result).toEqual(['example.com', 'test.io']);
    });
  });

  describe('mergeDomains', () => {
    it('should merge unique domains only', () => {
      const current = ['example.com', 'test.io'];
      const newDomains = ['new.com', 'test.io'];
      const result = service.mergeDomains(current, newDomains);
      expect(result).toEqual(['example.com', 'test.io', 'new.com']);
    });

    it('should handle case-insensitive duplicates', () => {
      const current = ['example.com'];
      const newDomains = ['EXAMPLE.COM', 'new.com'];
      const result = service.mergeDomains(current, newDomains);
      expect(result).toEqual(['example.com', 'new.com']);
    });

    it('should preserve existing domains order', () => {
      const current = ['b.com', 'a.com', 'c.com'];
      const newDomains = ['d.com'];
      const result = service.mergeDomains(current, newDomains);
      expect(result).toEqual(['b.com', 'a.com', 'c.com', 'd.com']);
    });

    it('should handle empty current domains', () => {
      const current: string[] = [];
      const newDomains = ['new.com'];
      const result = service.mergeDomains(current, newDomains);
      expect(result).toEqual(['new.com']);
    });

    it('should normalize new domains before merging', () => {
      const current = ['example.com'];
      const newDomains = ['  NEW.COM  ', 'TEST.IO'];
      const result = service.mergeDomains(current, newDomains);
      expect(result).toEqual(['example.com', 'new.com', 'test.io']);
    });
  });

  describe('filterDomains', () => {
    it('should remove specified domains', () => {
      const current = ['example.com', 'test.io', 'keep.com'];
      const toRemove = ['example.com', 'test.io'];
      const result = service.filterDomains(current, toRemove);
      expect(result).toEqual(['keep.com']);
    });

    it('should handle case-insensitive removal', () => {
      const current = ['example.com', 'TEST.io'];
      const toRemove = ['EXAMPLE.COM', 'test.IO'];
      const result = service.filterDomains(current, toRemove);
      expect(result).toEqual([]);
    });

    it('should ignore non-existent domains', () => {
      const current = ['example.com'];
      const toRemove = ['notfound.com'];
      const result = service.filterDomains(current, toRemove);
      expect(result).toEqual(['example.com']);
    });

    it('should preserve domains not in removal list', () => {
      const current = ['a.com', 'b.com', 'c.com'];
      const toRemove = ['b.com'];
      const result = service.filterDomains(current, toRemove);
      expect(result).toEqual(['a.com', 'c.com']);
    });

    it('should handle empty removal list', () => {
      const current = ['example.com'];
      const toRemove: string[] = [];
      const result = service.filterDomains(current, toRemove);
      expect(result).toEqual(['example.com']);
    });

    it('should handle removal with whitespace', () => {
      const current = ['example.com', 'test.io'];
      const toRemove = ['  example.com  '];
      const result = service.filterDomains(current, toRemove);
      expect(result).toEqual(['test.io']);
    });
  });

  describe('formatDomainsResponse', () => {
    const createdAt = '2024-01-01T00:00:00Z';

    it('should format domains with created_at timestamp', () => {
      const domains = ['example.com', 'test.io'];
      const result = service.formatDomainsResponse(domains, createdAt);
      expect(result).toEqual([
        { domain: 'example.com', created_at: '2024-01-01T00:00:00.000Z' },
        { domain: 'test.io', created_at: '2024-01-01T00:00:00.000Z' },
      ]);
    });

    it('should handle null domains array', () => {
      const result = service.formatDomainsResponse(null, createdAt);
      expect(result).toEqual([]);
    });

    it('should handle empty domains array', () => {
      const result = service.formatDomainsResponse([], createdAt);
      expect(result).toEqual([]);
    });

    it('should preserve domain order', () => {
      const domains = ['c.com', 'a.com', 'b.com'];
      const result = service.formatDomainsResponse(domains, createdAt);
      expect(result).toEqual([
        { domain: 'c.com', created_at: '2024-01-01T00:00:00.000Z' },
        { domain: 'a.com', created_at: '2024-01-01T00:00:00.000Z' },
        { domain: 'b.com', created_at: '2024-01-01T00:00:00.000Z' },
      ]);
    });
  });
});