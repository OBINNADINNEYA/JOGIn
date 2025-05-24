import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import Navbar from '@/components/Navigation/Navbar';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock the usePathname hook since it's used in the Navbar
jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Setup auth mock values
const mockAuthUser = { id: '123', email: 'test@example.com' };
const mockAuthSession = { user: mockAuthUser };
const mockSessionResponse = { data: { session: mockAuthSession } };
const mockEmptySessionResponse = { data: { session: null } };

// Mock supabase auth
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve(mockEmptySessionResponse)),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
      signOut: jest.fn().mockResolvedValue({}),
    },
  },
}));

describe('Navbar', () => {
  const renderWithProviders = () => {
    return render(
      <ThemeProvider>
        <Navbar />
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    window.scrollY = 0;
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 0,
    });
    // Reset mock to default unauthenticated state
    require('@/lib/supabase').supabase.auth.getSession.mockImplementation(() => 
      Promise.resolve(mockEmptySessionResponse)
    );
  });

  it('renders the logo', async () => {
    const { getByText } = renderWithProviders();
    expect(getByText('JOGIn')).toBeInTheDocument();
  });

  it('changes background on scroll', async () => {
    const { getByRole } = renderWithProviders();
    
    // Initial state (not scrolled)
    const nav = getByRole('navigation');
    expect(nav).not.toHaveClass('backdrop-blur-xl');
    
    // Trigger scroll event
    Object.defineProperty(window, 'scrollY', { value: 20 });
    fireEvent.scroll(window);
    
    // After scroll
    expect(nav).toHaveClass('backdrop-blur-xl');
  });

  it('toggles mobile menu on button click', async () => {
    const { getByLabelText } = renderWithProviders();
    
    // Mobile menu should be hidden initially
    const mobileMenu = document.querySelector('div.md\\:hidden.transition-all');
    expect(mobileMenu).toHaveClass('opacity-0');
    
    // Click the mobile menu button
    const menuButton = getByLabelText('Toggle navigation menu');
    fireEvent.click(menuButton);
    
    // Mobile menu should be visible after click
    expect(mobileMenu).toHaveClass('opacity-100');
    
    // Click again to hide
    fireEvent.click(menuButton);
    expect(mobileMenu).toHaveClass('opacity-0');
  });

  it('shows the correct links when user is authenticated', async () => {
    // Mock authenticated user
    require('@/lib/supabase').supabase.auth.getSession.mockImplementation(() => 
      Promise.resolve(mockSessionResponse)
    );
    
    renderWithProviders();
    
    // Wait for auth check to complete and verify auth navigation
    await waitFor(() => {
      expect(screen.getAllByText('Dashboard')[0]).toBeInTheDocument();
    });
    
    expect(screen.getAllByText('Profile')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Sign Out')[0]).toBeInTheDocument();
  });

  it('shows the correct links when user is not authenticated', async () => {
    // Already mocked in beforeEach to return null session
    renderWithProviders();
    
    // Wait for auth check to complete 
    await waitFor(() => {
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });
    
    // There might be multiple Sign In/Sign Up elements (for mobile and desktop)
    expect(screen.getAllByText('Sign In').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sign Up').length).toBeGreaterThan(0);
  });
}); 