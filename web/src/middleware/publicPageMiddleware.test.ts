import { isEmbedPage } from './publicPageMiddleware';

// Unit tests for isEmbedPage
describe('isEmbedPage', () => {
  it('should return true for embed metric routes', () => {
    const request = {
      nextUrl: {
        pathname: '/embed/metrics/123'
      }
    } as any;
    expect(isEmbedPage(request)).toBe(true);
  });

  it('should return true for embed dashboard routes', () => {
    const request = {
      nextUrl: {
        pathname: '/embed/dashboards/456'
      }
    } as any;
    expect(isEmbedPage(request)).toBe(true);
  });

  it('should return false for non-embed routes', () => {
    const request = {
      nextUrl: {
        pathname: '/metrics/123'
      }
    } as any;
    expect(isEmbedPage(request)).toBe(false);
  });
});
