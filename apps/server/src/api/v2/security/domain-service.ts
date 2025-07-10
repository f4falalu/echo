export class DomainService {
  normalizeDomains(domains: string[]): string[] {
    return domains.map(d => d.toLowerCase().trim());
  }

  mergeDomains(currentDomains: string[], newDomains: string[]): string[] {
    const normalizedCurrent = this.normalizeDomains(currentDomains);
    const normalizedNew = this.normalizeDomains(newDomains);
    
    // Filter out duplicates from new domains
    const uniqueNew = normalizedNew.filter(d => !normalizedCurrent.includes(d));
    
    // Return original current domains plus unique new ones
    return [...currentDomains, ...uniqueNew];
  }

  filterDomains(currentDomains: string[], domainsToRemove: string[]): string[] {
    const normalizedToRemove = this.normalizeDomains(domainsToRemove);
    
    // Filter out domains that match (case-insensitive)
    return currentDomains.filter(
      domain => !normalizedToRemove.includes(domain.toLowerCase().trim())
    );
  }

  formatDomainsResponse(
    domains: string[] | null,
    createdAt: string
  ): Array<{ domain: string; created_at: string }> {
    if (!domains || domains.length === 0) {
      return [];
    }
    
    // Convert PostgreSQL timestamp to ISO string format
    const isoCreatedAt = new Date(createdAt).toISOString();
    
    return domains.map(domain => ({
      domain,
      created_at: isoCreatedAt,
    }));
  }
}