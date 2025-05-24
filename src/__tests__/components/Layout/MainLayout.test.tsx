import React from 'react';
import { render, screen } from '@testing-library/react';
import MainLayout from '@/components/Layout/MainLayout';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock the Navbar component to simplify testing
jest.mock('@/components/Navigation/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="mock-navbar">Navbar</div>;
  };
});

// Mock the useTheme hook
jest.mock('@/contexts/ThemeContext', () => {
  const originalModule = jest.requireActual('@/contexts/ThemeContext');
  return {
    ...originalModule,
    useTheme: jest.fn(),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

describe('MainLayout', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock document.body.classList methods
    document.body.classList.remove = jest.fn();
    document.body.classList.add = jest.fn();
  });

  it('renders children and navbar', () => {
    // Mock the useTheme hook to return dark theme
    require('@/contexts/ThemeContext').useTheme.mockReturnValue({
      theme: 'dark',
      toggleTheme: jest.fn(),
    });

    render(
      <MainLayout>
        <div data-testid="test-child">Test Child</div>
      </MainLayout>
    );

    // Check if navbar and children are rendered
    expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('applies dark theme classes', () => {
    // Mock the useTheme hook to return dark theme
    require('@/contexts/ThemeContext').useTheme.mockReturnValue({
      theme: 'dark',
      toggleTheme: jest.fn(),
    });

    const { container } = render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );

    // Check if dark theme classes are applied to the root div
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv).toHaveClass('dark-theme');
    
    // Check if body classes were updated
    expect(document.body.classList.remove).toHaveBeenCalledWith('dark-theme', 'light-theme');
    expect(document.body.classList.add).toHaveBeenCalledWith('dark-theme');
  });

  it('applies light theme classes', () => {
    // Mock the useTheme hook to return light theme
    require('@/contexts/ThemeContext').useTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
    });

    const { container } = render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );

    // Check if light theme classes are applied to the root div
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv).toHaveClass('light-theme');
    
    // Check if body classes were updated
    expect(document.body.classList.remove).toHaveBeenCalledWith('dark-theme', 'light-theme');
    expect(document.body.classList.add).toHaveBeenCalledWith('light-theme');
  });
}); 