'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/Layout/MainLayout';
import { getRandomRunnerImage } from '@/lib/imageUtils';

interface RunClub {
  id: string;
  name: string;
  description: string;
  location: string;
  member_count: { count: number } | number;
  latest_posts: {
    id: string;
    content: string;
    created_at: string;
  }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [clubs, setClubs] = useState<RunClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    fetchClubs();
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      setSubscription(data);
    }
  };

  const fetchClubs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      console.log('Fetching clubs for leader dashboard...');

      // First get clubs with basic info
      const { data: clubsData, error: clubsError } = await supabase
        .from('run_clubs')
        .select(`
          id,
          name,
          description,
          location,
          latest_posts:run_club_posts(
            id,
            content,
            created_at
          )
        `)
        .eq('leader_id', user.id)
        .order('created_at', { ascending: false });

      if (clubsError) throw clubsError;
      
      // Then for each club, get the membership count using a separate query
      const processedData = await Promise.all(
        clubsData.map(async (club) => {
          const { count, error: countError } = await supabase
            .from('run_club_memberships')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', club.id);
            
          if (countError) {
            console.error('Error counting memberships for club:', club.id, countError);
            return { ...club, member_count: 0 };
          }
          
          console.log(`Club ${club.name} member count:`, count);
          return { ...club, member_count: count || 0 };
        })
      );

      console.log('Processed club data with counts:', processedData);
      setClubs(processedData || []);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!selectedClub || !newPost.trim()) return;

    try {
      const { error } = await supabase
        .from('run_club_posts')
        .insert([
          {
            club_id: selectedClub,
            content: newPost.trim(),
            author_id: (await supabase.auth.getUser()).data.user?.id,
          },
        ]);

      if (error) throw error;

      setNewPost('');
      fetchClubs(); // Refresh the list
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error creating post. Please try again.');
    }
  };

  // Helper function to get member count
  const getMemberCount = (count: number | null): number => {
    return count || 0;
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
          <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-teal-400 to-teal-600 bg-clip-text text-transparent mb-4 md:mb-0">
            Club Leader Dashboard
          </h1>
          <button
            onClick={() => router.push('/create-club')}
            className="inline-flex items-center bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg transition-colors shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create New Club
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        ) : clubs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-6 text-center">
            <p className="text-gray-400 text-xl">You haven't created any clubs yet.</p>
            <button
              onClick={() => router.push('/create-club')}
              className="inline-flex items-center bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium text-lg transition-colors shadow-xl transform hover:scale-105 transition-transform duration-200"
            >
              Create Your First Club
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {clubs.map((club) => (
              <div
                key={club.id}
                className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden transition-all hover:shadow-2xl"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">{club.name}</h2>
                      <p className="text-gray-300">{club.description}</p>
                      <div className="flex items-center mt-3 space-x-4 text-sm text-gray-400">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {club.location}
                        </div>
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          {getMemberCount(club.member_count)} members
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/clubs/${club.id}/settings`)}
                      className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>

                  <div className="border-t border-white/10 pt-5">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      Recent Posts
                    </h3>
                    
                    <div className="space-y-4 mb-6">
                      {club.latest_posts && club.latest_posts.length > 0 ? (
                        club.latest_posts.map((post) => (
                          <div key={post.id} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                            <p className="text-gray-200">{post.content}</p>
                            <p className="text-gray-500 text-sm mt-2">
                              {new Date(post.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-center py-4">No posts yet. Create your first post below.</div>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <input
                        type="text"
                        placeholder="Write a new post..."
                        value={selectedClub === club.id ? newPost : ''}
                        onChange={(e) => {
                          setSelectedClub(club.id);
                          setNewPost(e.target.value);
                        }}
                        className="flex-1 px-4 py-3 rounded-lg bg-black/30 text-white border border-white/10 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder-gray-500"
                      />
                      <button
                        onClick={handleCreatePost}
                        disabled={selectedClub !== club.id || !newPost.trim()}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
} 