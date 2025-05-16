'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/Layout/MainLayout';

interface Post {
  id: string;
  content: string;
  created_at: string;
  club: {
    id: string;
    name: string;
  };
  author: {
    full_name: string;
  };
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      let query = supabase
        .from('run_club_posts')
        .select(`
          id,
          content,
          created_at,
          club:run_clubs(id, name),
          author:profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (profile?.role === 'runner') {
        // For runners, only show posts from clubs they're members of
        query = query.in(
          'club_id',
          supabase
            .from('run_club_memberships')
            .select('club_id')
            .eq('runner_id', user.id)
        );
      } else {
        // For leaders, show posts from their clubs
        query = query.in(
          'club_id',
          supabase
            .from('run_clubs')
            .select('id')
            .eq('leader_id', user.id)
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Club Updates</h1>

        {loading ? (
          <div className="text-center text-gray-400">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-gray-400">
            No posts yet. Join some clubs to see their updates!
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-gray-800 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {post.club.name}
                    </h2>
                    <p className="text-gray-400">
                      Posted by {post.author.full_name}
                    </p>
                  </div>
                  <span className="text-gray-400 text-sm">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-300 whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
} 