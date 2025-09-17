import Cookies from 'js-cookie';

/**
 * Clears all browser storage including localStorage, sessionStorage, and cookies
 * @returns void
 */
export const clearAllBrowserStorage = (): void => {
  // Clear localStorage
  localStorage.clear();

  // Clear sessionStorage
  sessionStorage.clear();

  // Clear all cookies using js-cookie
  const cookieNames = Object.keys(Cookies.get());

  for (const cookieName of cookieNames) {
    // Remove with various path and domain combinations
    Cookies.remove(cookieName);
    Cookies.remove(cookieName, { path: '/' });
    Cookies.remove(cookieName, { path: '' });

    // Try removing with domain variations
    const currentDomain = window.location.hostname;
    Cookies.remove(cookieName, { path: '/', domain: currentDomain });
    Cookies.remove(cookieName, { path: '/', domain: `.${currentDomain}` });

    // Handle parent domain for subdomains
    const domainParts = currentDomain.split('.');
    if (domainParts.length > 1) {
      const parentDomain = domainParts.slice(-2).join('.');
      Cookies.remove(cookieName, { path: '/', domain: `.${parentDomain}` });
    }
  }
};
