'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/Layout/MainLayout';

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const DISTANCE_OPTIONS = [
  '5km', '6km', '7km', '8km', '9km', '10km', '20km'
];

export default function CreateClubPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    meeting_days: [] as string[],
    start_time: '',
    end_time: '',
    start_location: '',
    end_location: '',
    route_details: '',
    distance: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check if user has a free plan and already has a club
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan_type')
        .eq('user_id', user.id)
        .single();

      if (subscription?.plan_type === 'free') {
        const { data: existingClubs } = await supabase
          .from('run_clubs')
          .select('id')
          .eq('leader_id', user.id);

        if (existingClubs && existingClubs.length > 0) {
          throw new Error('Free plan leaders can only create one club. Upgrade to Pro to create more clubs!');
        }
      }

      // Create the club
      const { error: clubError } = await supabase
        .from('run_clubs')
        .insert([
          {
            ...formData,
            leader_id: user.id,
          },
        ]);

      if (clubError) throw clubError;

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (day: string) => {
    setFormData(prev => {
      const newDays = prev.meeting_days.includes(day)
        ? prev.meeting_days.filter(d => d !== day)
        : [...prev.meeting_days, day];
      
      return {
        ...prev,
        meeting_days: newDays,
      };
    });
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-teal-600 bg-clip-text text-transparent mb-8">Create a New Running Club</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info Section */}
            <div className="bg-black/20 rounded-xl p-6 space-y-6">
              <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">Basic Information</h2>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                  Club Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  placeholder="e.g., Morning Joggers Club"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  placeholder="Tell potential members about your club..."
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">
                  General Location *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  placeholder="e.g., Central Park, New York"
                />
              </div>
            </div>

            {/* Schedule Section */}
            <div className="bg-black/20 rounded-xl p-6 space-y-6">
              <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">Schedule</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Meeting Days *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DAYS_OF_WEEK.map(day => (
                    <label key={day} className="flex items-center space-x-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.meeting_days.includes(day)}
                        onChange={() => handleCheckboxChange(day)}
                        className="rounded border-gray-700 bg-black/40 text-teal-500 focus:ring-teal-500"
                      />
                      <span className="text-gray-300 group-hover:text-white transition-colors">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_time" className="block text-sm font-medium text-gray-300 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    id="start_time"
                    name="start_time"
                    required
                    value={formData.start_time}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="end_time" className="block text-sm font-medium text-gray-300 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    id="end_time"
                    name="end_time"
                    required
                    value={formData.end_time}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Route Details Section */}
            <div className="bg-black/20 rounded-xl p-6 space-y-6">
              <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">Route Information</h2>
              
              <div>
                <label htmlFor="distance" className="block text-sm font-medium text-gray-300 mb-1">
                  Route Distance *
                </label>
                <select
                  id="distance"
                  name="distance"
                  required
                  value={formData.distance}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                >
                  <option value="" disabled>Select a distance</option>
                  {DISTANCE_OPTIONS.map(distance => (
                    <option key={distance} value={distance}>{distance}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="start_location" className="block text-sm font-medium text-gray-300 mb-1">
                  Start Location *
                </label>
                <input
                  type="text"
                  id="start_location"
                  name="start_location"
                  required
                  value={formData.start_location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  placeholder="e.g., Central Park East Entrance, 5th Ave"
                />
              </div>

              <div>
                <label htmlFor="end_location" className="block text-sm font-medium text-gray-300 mb-1">
                  End Location *
                </label>
                <input
                  type="text"
                  id="end_location"
                  name="end_location"
                  required
                  value={formData.end_location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  placeholder="e.g., Central Park West Entrance, W 86th St"
                />
              </div>

              <div>
                <label htmlFor="route_details" className="block text-sm font-medium text-gray-300 mb-1">
                  Route Details
                </label>
                <textarea
                  id="route_details"
                  name="route_details"
                  value={formData.route_details}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  placeholder="Describe the running route, terrain, difficulty level, and any notable landmarks along the way..."
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 relative overflow-hidden group bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                <span className="relative flex items-center">
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Club...
                    </>
                  ) : 'Create Club'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
} 