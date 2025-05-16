'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { stripePromise, SUBSCRIPTION_PRICES } from '@/lib/stripe';
import MainLayout from '@/components/Layout/MainLayout';

interface UserProfile {
  role: 'runner' | 'leader';
  subscription?: {
    plan_type: 'free' | 'pro';
  };
}

export default function SubscriptionPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          role,
          subscription:subscriptions (
            plan_type
          )
        `)
        .eq('id', session.user.id)
        .single();

      setProfile(profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!profile) return;
    
    setCheckoutLoading(true);
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe not loaded');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: SUBSCRIPTION_PRICES[profile.role].pro,
          userId: session.user.id,
          userRole: profile.role,
        }),
      });

      const { sessionId } = await response.json();
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert('Failed to start checkout process. Please try again.');
    } finally {
      setCheckoutLoading(false);
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

  const isRunner = profile?.role === 'runner';
  const isPro = profile?.subscription?.plan_type === 'pro';

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          {isRunner ? 'Runner Subscriptions' : 'Club Leader Subscriptions'}
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">
              {isRunner ? 'Jogger Pass' : 'Starter Club'}
              {!isPro && <span className="ml-2 text-teal-400">(Current)</span>}
            </h2>
            <p className="text-gray-300 mb-6">Free</p>
            <ul className="space-y-3 text-gray-300 mb-6">
              {isRunner ? (
                <>
                  <li>• Join up to 2 clubs</li>
                  <li>• Basic club filtering</li>
                  <li>• View club posts</li>
                  <li>• Standard features</li>
                </>
              ) : (
                <>
                  <li>• Single club management</li>
                  <li>• Basic posting</li>
                  <li>• Member management</li>
                  <li>• Standard features</li>
                </>
              )}
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="bg-gray-800 rounded-lg p-6 border border-teal-600">
            <h2 className="text-xl font-semibold text-white mb-4">
              {isRunner ? 'Pacer Pro' : 'Organizer Pro'}
              {isPro && <span className="ml-2 text-teal-400">(Current)</span>}
            </h2>
            <p className="text-gray-300 mb-6">$9.99/month</p>
            <ul className="space-y-3 text-gray-300 mb-6">
              {isRunner ? (
                <>
                  <li>• Unlimited club joins</li>
                  <li>• Advanced filtering</li>
                  <li>• RSVP analytics</li>
                  <li>• Premium features</li>
                </>
              ) : (
                <>
                  <li>• Event analytics</li>
                  <li>• Stripe event checkout</li>
                  <li>• Club promotion tools</li>
                  <li>• Premium features</li>
                </>
              )}
            </ul>
            {!isPro && (
              <button
                onClick={handleSubscribe}
                disabled={checkoutLoading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out disabled:opacity-50"
              >
                {checkoutLoading ? 'Processing...' : 'Upgrade to Pro'}
              </button>
            )}
          </div>
        </div>

        {isPro && (
          <div className="mt-8 text-center">
            <p className="text-gray-300 mb-4">
              Manage your subscription in the settings page.
            </p>
            <a
              href="/settings"
              className="text-teal-400 hover:text-teal-300 underline"
            >
              Go to Settings
            </a>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 