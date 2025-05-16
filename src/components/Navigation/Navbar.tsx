'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

export default function Navbar() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Handle scroll
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Define navigation links based on authentication status
  const navLinks = user ? [
    { href: '/explore', label: 'Explore' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/profile', label: 'Profile' },
  ] : [
    { href: '/auth/sign-in', label: 'Sign In' },
    { href: '/auth/sign-up', label: 'Sign Up' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? theme === 'dark' 
            ? 'backdrop-blur-xl bg-premium-black/80 border-b border-premium-border' 
            : 'backdrop-blur-xl bg-white/80 border-b border-black/5' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link 
            href="/"
            className="flex-shrink-0 flex items-center space-x-2"
          >
            <span className="text-2xl font-bold font-display heading-gradient">
              JOGIn
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {user ? (
              <>
                {/* Navigation links for authenticated users */}
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                      pathname === link.href
                        ? 'bg-premium-accent/10 text-premium-accent'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={handleSignOut}
                  className="ml-2 px-5 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                {/* Navigation links for unauthenticated users */}
                {navLinks.slice(0, -1).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                      pathname === link.href
                        ? 'bg-premium-accent/10 text-premium-accent'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                
                {/* Sign Up button with premium styling */}
                <Link
                  href="/auth/sign-up"
                  className="premium-button ml-2 px-5 py-2 rounded-xl text-sm font-medium whitespace-nowrap"
                >
                  {navLinks.slice(-1)[0].label}
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-gray-400 hover:text-white hover:bg-premium-gray/50 focus:outline-none focus:ring-2 focus:ring-premium-accent"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div 
        className={`md:hidden transition-all duration-500 transform ${
          isMenuOpen 
            ? 'translate-y-0 opacity-100' 
            : '-translate-y-10 opacity-0 pointer-events-none'
        }`}
      >
        <div className="px-2 pt-4 pb-6 space-y-2 backdrop-blur-xl bg-premium-black/90 border-b border-premium-border">
          {user ? (
            <>
              {/* Navigation links for authenticated mobile users */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                    pathname === link.href
                      ? 'bg-premium-accent/10 text-premium-accent'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  handleSignOut();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              {/* Navigation links for unauthenticated mobile users */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={link.href === '/auth/sign-up' 
                    ? 'premium-button block text-center py-3 rounded-xl text-base font-medium'
                    : `block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                        pathname === link.href
                          ? 'bg-premium-accent/10 text-premium-accent'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 