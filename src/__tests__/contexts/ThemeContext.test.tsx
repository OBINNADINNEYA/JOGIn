import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

// Create a test component that uses the theme context
const TestComponent = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <div data-testid="theme-value">{theme}</div>
      <button data-testid="toggle-btn" onClick={toggleTheme}>
        Toggle Theme
      </button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    // Clear localStorage and reset mocks
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should initialize with dark theme by default', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Verify the theme is initialized as dark
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
    
    // Verify localStorage was accessed to check for saved theme
    expect(localStorage.getItem).toHaveBeenCalledWith('jogIn-theme');
  });

  it('should toggle theme when toggleTheme is called', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Initial state should be dark
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');

    // Toggle the theme
    await act(async () => {
      fireEvent.click(screen.getByTestId('toggle-btn'));
    });

    // After toggle, theme should be light
    expect(screen.getByTestId('theme-value').textContent).toBe('light');
    
    // Verify localStorage was updated with the new theme
    expect(localStorage.setItem).toHaveBeenCalledWith('jogIn-theme', 'light');

    // Toggle again back to dark
    await act(async () => {
      fireEvent.click(screen.getByTestId('toggle-btn'));
    });

    // After second toggle, theme should be dark again
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
    expect(localStorage.setItem).toHaveBeenCalledWith('jogIn-theme', 'dark');
  });

  it('should use theme from localStorage if available', async () => {
    // Set up localStorage to return 'light' theme
    localStorage.getItem.mockReturnValueOnce('light');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Theme should initialize as light from localStorage
    expect(screen.getByTestId('theme-value').textContent).toBe('light');
  });

  it('should handle localStorage errors gracefully', async () => {
    // Simulate an error when accessing localStorage
    localStorage.getItem.mockImplementationOnce(() => {
      throw new Error('localStorage not available');
    });

    // This shouldn't throw an error
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should still initialize with the default dark theme
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
  });
}); 