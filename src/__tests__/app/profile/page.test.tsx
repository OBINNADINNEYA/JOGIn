import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePage from '@/app/profile/page';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock the router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/profile',
}));

// Mock MainLayout
jest.mock('@/components/Layout/MainLayout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

// Mock useTheme separately to avoid initialization issues
const mockToggleTheme = jest.fn();

// Mock ThemeContext
jest.mock('@/contexts/ThemeContext', () => {
  const actual = jest.requireActual('@/contexts/ThemeContext');
  return {
    ...actual,
    useTheme: () => ({
      theme: 'dark',
      toggleTheme: mockToggleTheme,
    }),
  };
});

// Mock Supabase responses for profile
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            user: { id: 'user123' }
          }
        }
      }),
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: { email: 'test@example.com' }
        }
      }),
    },
    from: jest.fn().mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'user123',
              full_name: 'Test User',
              email: 'test@example.com',
              role: 'runner',
              avatar_url: null,
              created_at: '2023-01-01T00:00:00.000Z',
            },
            error: null,
          }),
        };
      }
      if (table === 'run_clubs' || table === 'run_club_memberships') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          count: jest.fn().mockReturnThis(),
          head: jest.fn().mockReturnThis(),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
    }),
  },
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock setTimeout
    jest.useFakeTimers();
    // Mock window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders profile information', async () => {
    render(
      <ThemeProvider>
        <ProfilePage />
      </ThemeProvider>
    );

    // Wait for profile data to load
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Check other profile elements
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Runner')).toBeInTheDocument();
  });

  it('navigates to settings page when Edit Profile button is clicked', async () => {
    render(
      <ThemeProvider>
        <ProfilePage />
      </ThemeProvider>
    );

    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    // Click the Edit Profile button
    fireEvent.click(screen.getByText('Edit Profile'));

    // Verify router.push was called with the correct path
    expect(mockPush).toHaveBeenCalledWith('/settings');

    // Advance timers to trigger the fallback
    jest.advanceTimersByTime(200);

    // Verify the fallback redirection was also triggered
    expect(window.location.href).toBe('/settings');
  });

  it('toggles theme when Dark Mode switch is clicked', async () => {
    render(
      <ThemeProvider>
        <ProfilePage />
      </ThemeProvider>
    );

    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByLabelText('Dark Mode')).toBeInTheDocument();
    });

    // Toggle the theme switch
    fireEvent.click(screen.getByLabelText('Dark Mode'));

    // Verify our mock toggle function was called
    expect(mockToggleTheme).toHaveBeenCalled();
  });
}); 