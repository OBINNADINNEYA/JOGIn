'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/Layout/MainLayout';

interface ClubMember {
  id: string;
  full_name: string;
  avatar_url: string | null;
  joined_at: string;
}

interface Club {
  id: string;
  name: string;
  members: ClubMember[];
}

export default function MembersPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'runner' | 'leader' | null>(null);
  const [selectedClub, setSelectedClub] = useState<string | null>(null);

  useEffect(() => {
    fetchUserRoleAndClubs();
    
    // Set up real-time subscription for membership changes
    const membershipSubscription = supabase
      .channel('membership-changes-members')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'run_club_memberships'
        },
        (payload) => {
          console.log('Membership change detected in members page:', payload);
          // Refresh the list when membership changes
          fetchUserRoleAndClubs();
        }
      )
      .subscribe();
      
    return () => {
      // Clean up subscription on component unmount
      supabase.removeChannel(membershipSubscription);
    };
  }, []);

  const fetchUserRoleAndClubs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      setUserRole(profile?.role as 'runner' | 'leader');

      // Fetch clubs based on role
      if (profile?.role === 'runner') {
        const { data: memberClubs } = await supabase
          .from('run_club_memberships')
          .select(`
            club:run_clubs(
              id,
              name,
              members:run_club_memberships(
                member:profiles(
                  id,
                  full_name,
                  avatar_url
                ),
                created_at
              )
            )
          `)
          .eq('runner_id', user.id);

        if (memberClubs) {
          setClubs(memberClubs.map(({ club }) => ({
            id: club.id,
            name: club.name,
            members: club.members.map(({ member, created_at }) => ({
              id: member.id,
              full_name: member.full_name,
              avatar_url: member.avatar_url,
              joined_at: created_at,
            })),
          })));
        }
      } else {
        const { data: leaderClubs } = await supabase
          .from('run_clubs')
          .select(`
            id,
            name,
            members:run_club_memberships(
              member:profiles(
                id,
                full_name,
                avatar_url
              ),
              created_at
            )
          `)
          .eq('leader_id', user.id);

        if (leaderClubs) {
          setClubs(leaderClubs.map(club => ({
            id: club.id,
            name: club.name,
            members: club.members.map(({ member, created_at }) => ({
              id: member.id,
              full_name: member.full_name,
              avatar_url: member.avatar_url,
              joined_at: created_at,
            })),
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (clubId: string, memberId: string) => {
    try {
      const { error } = await supabase
        .from('run_club_memberships')
        .delete()
        .eq('club_id', clubId)
        .eq('runner_id', memberId);

      if (error) throw error;

      // Update local state immediately
      setClubs(prevClubs => {
        return prevClubs.map(club => {
          if (club.id === clubId) {
            return {
              ...club,
              members: club.members.filter(member => member.id !== memberId)
            };
          }
          return club;
        });
      });

      // Force a refresh after a short delay to ensure consistency
      setTimeout(() => {
        fetchUserRoleAndClubs();
      }, 100);
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Error removing member. Please try again.');
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">
          {userRole === 'leader' ? 'Club Members' : 'Fellow Runners'}
        </h1>

        {loading ? (
          <div className="text-center text-gray-400">Loading members...</div>
        ) : clubs.length === 0 ? (
          <div className="text-center text-gray-400">
            {userRole === 'leader'
              ? "You haven't created any clubs yet."
              : "You haven't joined any clubs yet."}
          </div>
        ) : (
          <div className="space-y-8">
            {clubs.map((club) => (
              <div key={club.id} className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                  <h2 className="text-2xl font-semibold text-white">
                    {club.name}
                  </h2>
                  <p className="text-gray-400 mt-1">
                    {club.members.length} member{club.members.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {club.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center space-x-4 bg-gray-700 p-4 rounded-lg"
                      >
                        <div className="flex-shrink-0">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.full_name}
                              className="h-12 w-12 rounded-full"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-600 flex items-center justify-center">
                              <span className="text-xl text-white">
                                {member.full_name[0]}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {member.full_name}
                          </p>
                          <p className="text-sm text-gray-400">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                        {userRole === 'leader' && (
                          <button
                            onClick={() => handleRemoveMember(club.id, member.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
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