'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/Layout/MainLayout';
import { useRouter } from 'next/navigation';

interface RunClub {
  id: string;
  name: string;
  description: string;
  location: string;
  leader: {
    full_name: string;
  };
  member_count: { count: number } | number;
}

export default function ExplorePage() {
  const router = useRouter();
  const [clubs, setClubs] = useState<RunClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [joinInProgress, setJoinInProgress] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkUser();
    fetchClubs();
    
    // Set up real-time subscription for membership changes
    const membershipSubscription = supabase
      .channel('membership-changes-explore')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'run_club_memberships'
        },
        (payload) => {
          console.log('Membership change detected in explore page:', payload);
          // Immediately refresh clubs data when membership changes
          fetchClubs();
        }
      )
      .subscribe();
      
    return () => {
      // Clean up subscription on component unmount
      supabase.removeChannel(membershipSubscription);
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setAuthChecked(true);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthChecked(true);
    }
  };

  const fetchClubs = async () => {
    try {
      setLoading(true);
      console.log('Fetching clubs...');
      
      // First get all clubs
      const { data: clubsData, error: clubsError } = await supabase
        .from('run_clubs')
        .select(`
          id,
          name,
          description,
          location,
          leader:leader_id(full_name)
        `)
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

      // Keep the same search filter applied after refresh
      if (searchQuery) {
        const filtered = processedData.filter(club =>
          club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          club.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          club.location.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setClubs(filtered || []);
      } else {
        setClubs(processedData || []);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClub = async (clubId: string) => {
    try {
      // Ensure we've checked auth status
      if (!authChecked) {
        await checkUser();
      }

      // Check if user is logged in
      if (!user) {
        console.log('User not logged in, redirecting to sign-in');
        router.push('/auth/sign-in');
        return;
      }

      setJoinInProgress(clubId);
      
      // Check if already a member
      const { data: existingMembership, error: membershipError } = await supabase
        .from('run_club_memberships')
        .select('id')
        .eq('club_id', clubId)
        .eq('runner_id', user.id)
        .single();
        
      if (existingMembership) {
        alert('You are already a member of this club.');
        setJoinInProgress(null);
        return;
      }

      console.log('Adding membership for club:', clubId, 'and user:', user.id);
      
      // Join the club
      const { error } = await supabase
        .from('run_club_memberships')
        .insert([
          {
            club_id: clubId,
            runner_id: user.id,
          },
        ]);

      if (error) {
        console.error('Error inserting membership:', error);
        throw error;
      }

      console.log('Successfully inserted membership');
      
      // Immediately update the local state to avoid waiting for the subscription
      setClubs(prevClubs => {
        return prevClubs.map(club => {
          if (club.id === clubId) {
            console.log(`Updating club ${club.name} member count locally`);
            const currentCount = typeof club.member_count === 'number' 
              ? club.member_count 
              : (club.member_count as any)?.count || 0;
            
            const newCount = currentCount + 1;
            console.log(`Previous count: ${currentCount}, New count: ${newCount}`);
            
            return {
              ...club,
              member_count: newCount
            };
          }
          return club;
        });
      });

      alert('Successfully joined the club!');
      
      // Force a refresh of the data to ensure sync
      setTimeout(() => {
        fetchClubs();
      }, 100);
      
    } catch (error: any) {
      console.error('Error joining club:', error);
      alert('Error joining club. Please try again.');
    } finally {
      setJoinInProgress(null);
    }
  };

  // Helper function to get member count
  const getMemberCount = (count: number | null): number => {
    return count || 0;
  };

  const filteredClubs = clubs.filter(club =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-teal-400 to-teal-600 bg-clip-text text-transparent">
            Explore Running Clubs
          </h1>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search clubs by name, description, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-black/30 text-white border border-gray-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder-gray-500 transition-colors"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.length > 0 ? (
              filteredClubs.map((club) => (
                <div
                  key={club.id}
                  className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-black/40 transition-all"
                >
                  <h3 className="text-xl font-semibold text-white mb-2">{club.name}</h3>
                  <p className="text-gray-300 mb-4">{club.description}</p>
                  <div className="text-gray-400 mb-4 space-y-1">
                    <p className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {club.location}
                    </p>
                    <p className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {getMemberCount(club.member_count)} members
                    </p>
                    <p className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Led by {club.leader.full_name}
                    </p>
                  </div>
                  <button
                    onClick={() => handleJoinClub(club.id)}
                    disabled={joinInProgress === club.id}
                    className="w-full relative overflow-hidden group bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 rounded-lg font-medium hover:from-teal-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                    <span className="relative flex justify-center items-center">
                      {joinInProgress === club.id ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Joining...
                        </>
                      ) : (
                        user ? 'Join Club' : 'Sign In to Join'
                      )}
                    </span>
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-400 py-12">
                No clubs found matching your search criteria.
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
} 