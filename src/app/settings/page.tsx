'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/Layout/MainLayout';
import { Cog6ToothIcon, CreditCardIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'runner' | 'leader';
  avatar_url: string | null;
  subscription?: {
    plan_type: 'free' | 'pro';
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchProfile();
    // Check for successful subscription
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      setMessage({
        type: 'success',
        text: 'Subscription updated successfully!'
      });
      // Remove the query parameter
      window.history.replaceState({}, '', '/settings');
    }
    
    // Set active tab from URL parameter
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'subscription', 'preferences'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
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

      if (profile) {
        setProfile(profile);
        setFullName(profile.full_name);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', profile.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!profile?.subscription?.stripe_customer_id) return;

    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: profile.subscription.stripe_customer_id,
        }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Failed to open subscription portal. Please try again.' });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-white">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

        {message && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === 'success' ? 'bg-green-800' : 'bg-red-800'
            }`}
          >
            <p className="text-white">{message.text}</p>
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'profile'
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <UserCircleIcon className="mr-3 h-6 w-6" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('subscription')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'subscription'
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <CreditCardIcon className="mr-3 h-6 w-6" />
                Subscription
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'preferences'
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Cog6ToothIcon className="mr-3 h-6 w-6" />
                Preferences
              </button>
            </nav>
          </div>

          {/* Main content */}
          <div className="md:col-span-3">
            <div className="bg-gray-800 rounded-lg p-6">
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-6">Profile Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profile?.email || ''}
                        disabled
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-400 shadow-sm cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        Role
                      </label>
                      <input
                        type="text"
                        value={profile?.role === 'runner' ? 'Runner' : 'Club Leader'}
                        disabled
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-400 shadow-sm cursor-not-allowed"
                      />
                    </div>
                    <button
                      onClick={handleUpdateProfile}
                      disabled={saving}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'subscription' && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-6">Subscription Settings</h2>
                  <div className="space-y-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-300">Current Plan:</p>
                      <p className="text-white text-lg font-semibold">
                        {profile?.subscription?.plan_type === 'pro'
                          ? profile?.role === 'runner'
                            ? 'Pacer Pro'
                            : 'Organizer Pro'
                          : profile?.role === 'runner'
                          ? 'Jogger Pass (Free)'
                          : 'Starter Club (Free)'}
                      </p>
                    </div>
                    {profile?.subscription?.plan_type === 'pro' && (
                      <button
                        onClick={handleManageSubscription}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out"
                      >
                        Manage Subscription
                      </button>
                    )}
                    {profile?.subscription?.plan_type === 'free' && (
                      <button
                        onClick={() => router.push('/subscription')}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out"
                      >
                        Upgrade to Pro
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-6">Preferences</h2>
                  <p className="text-gray-300">Notification and display preferences coming soon.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 