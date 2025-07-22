import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signInWithEmailAndPassword } from './signIn';

// Mock Next.js functions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}));

// Mock routes
vi.mock('@/routes', () => ({
  BusterRoutes: {
    APP_HOME: '/app',
    AUTH_CALLBACK: '/auth/callback'
  },
  createBusterRoute: vi.fn(({ route }) => route)
}));

// Mock Supabase server client
const mockSupabaseAuth = {
  signInWithPassword: vi.fn()
};

const mockSupabaseClient = {
  auth: mockSupabaseAuth
};

vi.mock('./server', () => ({
  createSupabaseServerClient: vi.fn(() => Promise.resolve(mockSupabaseClient))
}));

describe('signInWithEmailAndPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully sign in with valid credentials and redirect to default route', async () => {
    // Test case: Valid email and password should result in successful sign in
    // Expected output: Should call revalidatePath and redirect to APP_HOME

    const testEmail = 'test@example.com';
    const testPassword = 'password123';

    // Mock successful authentication
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      error: null,
      data: { user: { id: 'user-123' } }
    });

    // Mock redirect to throw (since redirect stops execution)
    const { redirect } = await import('next/navigation');
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error('REDIRECT_TO_/app');
    });

    try {
      await signInWithEmailAndPassword({
        email: testEmail,
        password: testPassword
      });
    } catch (error) {
      // Expect redirect to be called
      expect((error as Error).message).toBe('REDIRECT_TO_/app');
    }

    // Verify Supabase auth was called with correct parameters
    expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
      email: testEmail,
      password: testPassword
    });

    // Verify revalidatePath was called
    const { revalidatePath } = await import('next/cache');
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');

    // Verify redirect was called with correct route
    expect(redirect).toHaveBeenCalledWith('/app');
  });

  it('should return error when Supabase authentication fails', async () => {
    // Test case: Invalid credentials should return error response
    // Expected output: Should return { success: false, error: 'error message' }

    const testEmail = 'invalid@example.com';
    const testPassword = 'wrongpassword';
    const errorMessage = 'Invalid login credentials';

    // Mock failed authentication
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      error: { message: errorMessage },
      data: null
    });

    const result = await signInWithEmailAndPassword({
      email: testEmail,
      password: testPassword
    });

    // Verify error response
    expect(result).toEqual({
      success: false,
      error: errorMessage
    });

    // Verify Supabase auth was called with correct parameters
    expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
      email: testEmail,
      password: testPassword
    });

    // Verify revalidatePath and redirect were NOT called on error
    const { revalidatePath } = await import('next/cache');
    const { redirect } = await import('next/navigation');
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('should redirect to custom URL when valid redirectTo is provided', async () => {
    // Test case: Valid redirectTo parameter should redirect to custom URL instead of default
    // Expected output: Should redirect to the provided custom URL after successful authentication

    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    const customRedirectUrl = '/dashboard/analytics';

    // Mock successful authentication
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      error: null,
      data: { user: { id: 'user-123' } }
    });

    // Mock redirect to throw (since redirect stops execution)
    const { redirect } = await import('next/navigation');
    vi.mocked(redirect).mockImplementation((url: string) => {
      throw new Error(`REDIRECT_TO_${url}`);
    });

    try {
      await signInWithEmailAndPassword({
        email: testEmail,
        password: testPassword,
        redirectTo: encodeURIComponent(customRedirectUrl)
      });
    } catch (error) {
      // Expect redirect to be called with custom URL
      expect((error as Error).message).toBe(`REDIRECT_TO_${customRedirectUrl}`);
    }

    // Verify Supabase auth was called with correct parameters
    expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
      email: testEmail,
      password: testPassword
    });

    // Verify revalidatePath was called
    const { revalidatePath } = await import('next/cache');
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');

    // Verify redirect was called with custom URL (not default)
    expect(redirect).toHaveBeenCalledWith(customRedirectUrl);
    expect(redirect).not.toHaveBeenCalledWith('/app');
  });
});
