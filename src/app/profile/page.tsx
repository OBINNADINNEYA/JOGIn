'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/Layout/MainLayout';
import { useTheme } from '@/contexts/ThemeContext';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'runner' | 'leader';
  avatar_url: string | null;
  created_at: string;
  subscription?: {
    plan_type: 'free' | 'pro';
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [clubsCount, setClubsCount] = useState(0);
  const [membershipCount, setMembershipCount] = useState(0);

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/sign-in');
        return;
      }

      // Get user profile with subscription information
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          subscription:subscriptions (
            plan_type,
            stripe_customer_id,
            stripe_subscription_id
          )
        `)
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      
      // Get user email from auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (profile && user) {
        setProfile({
          ...profile,
          email: user.email || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Get memberships count
      const { count: membershipCount, error: membershipError } = await supabase
        .from('run_club_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('runner_id', session.user.id);

      if (membershipError) throw membershipError;
      setMembershipCount(membershipCount || 0);

      // Get club count for leaders
      const { count: clubsCount, error: clubsError } = await supabase
        .from('run_clubs')
        .select('*', { count: 'exact', head: true })
        .eq('leader_id', session.user.id);

      if (clubsError) throw clubsError;
      setClubsCount(clubsCount || 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleUpgradeClick = () => {
    router.push('/subscription');
  };

  const handleEditProfileClick = () => {
    router.push('/settings');
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-premium-accent"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-10 heading-gradient font-display">Profile</h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Profile Column */}
          <div className="md:col-span-1">
            <div className="premium-card p-8 animate-scale-in">
              <div className="flex flex-col items-center">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="h-28 w-28 rounded-full object-cover mb-6 border-4 border-premium-accent/20 shadow-premium"
                  />
                ) : (
                  <div className="h-28 w-28 rounded-full bg-gradient-to-br from-premium-accent to-premium-accentDark flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-premium">
                    {profile?.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <h2 className="text-2xl font-display font-semibold text-white mb-1">{profile?.full_name}</h2>
                <p className="text-gray-400 text-sm mb-3">{profile?.email}</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-premium-accent/20 text-premium-accent mb-4">
                  {profile?.role === 'runner' ? 'Runner' : 'Club Leader'}
                </span>
                
                <button
                  onClick={handleEditProfileClick}
                  className="premium-button-secondary w-full mt-2 flex items-center justify-center text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* Stats Column */}
          <div className="md:col-span-2 space-y-8">
            <div className="premium-card p-8 animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-2xl font-display font-semibold text-white mb-6">Account Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-premium-surface rounded-premium border border-premium-border transition-all duration-300 hover:bg-premium-gray/50">
                  <h3 className="text-gray-400 text-sm mb-2">Membership Status</h3>
                  <p className="text-white font-semibold text-lg">
                    {profile?.subscription?.plan_type === 'pro' 
                      ? 'Pro Member' 
                      : 'Free Member'}
                  </p>
                </div>
                
                <div className="p-5 bg-premium-surface rounded-premium border border-premium-border transition-all duration-300 hover:bg-premium-gray/50">
                  <h3 className="text-gray-400 text-sm mb-2">Member Since</h3>
                  <p className="text-white font-semibold text-lg">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                </div>
                
                <div className="p-5 bg-premium-surface rounded-premium border border-premium-border transition-all duration-300 hover:bg-premium-gray/50">
                  <h3 className="text-gray-400 text-sm mb-2">
                    {profile?.role === 'leader' ? 'Clubs Created' : 'Clubs Joined'}
                  </h3>
                  <div className="flex items-end">
                    <p className="text-white font-semibold text-3xl">
                      {profile?.role === 'leader' ? clubsCount : membershipCount}
                    </p>
                    <span className="text-gray-400 text-sm ml-2 mb-1">
                      {profile?.role === 'leader' ? 'clubs' : 'memberships'}
                    </span>
                  </div>
                </div>
                
                <div className="p-5 bg-premium-surface rounded-premium border border-premium-border transition-all duration-300 hover:bg-premium-gray/50">
                  <h3 className="text-gray-400 text-sm mb-2">Account Type</h3>
                  <p className="text-white font-semibold text-lg">
                    {profile?.role === 'leader' 
                      ? profile?.subscription?.plan_type === 'pro' 
                        ? 'Organizer Pro' 
                        : 'Starter Club'
                      : profile?.subscription?.plan_type === 'pro'
                        ? 'Pacer Pro'
                        : 'Jogger Pass'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            {/* Settings Section */}
            <div className="premium-card p-8 animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-2xl font-display font-semibold text-white mb-6">Settings</h2>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label htmlFor="dark-mode-toggle" className="text-white font-medium">Dark Mode</label>
                  <div className="relative inline-block w-14 align-middle select-none transition duration-300 ease-in">
                    <input
                      type="checkbox"
                      name="dark-mode-toggle"
                      id="dark-mode-toggle"
                      checked={theme === 'dark'}
                      onChange={toggleTheme}
                      className="sr-only"
                    />
                    <div className="block h-8 rounded-full bg-premium-surface w-14 border border-premium-border"></div>
                    <div
                      className={`absolute left-1 top-1 flex items-center justify-center w-6 h-6 rounded-full transition-transform duration-300 ease-in-out transform ${
                        theme === 'dark' ? 'translate-x-6 bg-premium-accent' : 'translate-x-0 bg-gray-400'
                      }`}
                    >
                      {theme === 'dark' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-gray-400 text-sm">Toggle between dark and light mode for your preferred visual experience</p>
              </div>
              
              {/* Subscription Section for Club Leaders */}
              {profile?.role === 'leader' && (
                <div className="mt-8 pt-6 border-t border-premium-border">
                  <h3 className="text-xl font-semibold text-white mb-4">Subscription Plan</h3>
                  <div className="p-6 rounded-premium bg-premium-gradient/5 border border-premium-border">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                      <div className="mb-4 md:mb-0">
                        <div className="flex items-center">
                          {profile?.subscription?.plan_type === 'pro' ? (
                            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-premium-accent mr-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-600 mr-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1.581.814L10 13.197l-4.419 2.617A1 1 0 014 15V4z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                          <span className="text-white font-semibold text-lg">
                            {profile?.subscription?.plan_type === 'pro' 
                              ? 'Organizer Pro' 
                              : 'Starter Club (Free)'}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mt-2 ml-11">
                          {profile?.subscription?.plan_type === 'pro' 
                            ? 'All premium features unlocked' 
                            : 'Basic features only'}
                        </p>
                      </div>
                      
                      {profile?.subscription?.plan_type !== 'pro' && (
                        <button
                          onClick={handleUpgradeClick}
                          className="premium-button"
                        >
                          Upgrade Now
                        </button>
                      )}
                      
                      {profile?.subscription?.plan_type === 'pro' && (
                        <button
                          onClick={() => router.push('/settings?tab=subscription')}
                          className="premium-button-secondary"
                        >
                          Manage Plan
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 