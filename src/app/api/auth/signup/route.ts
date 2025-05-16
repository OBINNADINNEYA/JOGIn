import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, role } = body;

    // Initialize Supabase client with cookies for the user
    const supabase = createRouteHandlerClient({ cookies });

    // Create admin client with service role key for actions that bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Signup the user with Supabase Auth via regular client
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData?.user?.id) {
      return NextResponse.json(
        { error: 'User creation failed' },
        { status: 400 }
      );
    }

    // 2. Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single();

    // Only create profile if it doesn't exist yet
    if (!existingProfile) {
      // Create the user profile with admin client to bypass RLS
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            full_name: fullName,
            role,
          },
        ]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        
        // Don't delete the auth user if it's a duplicate key error - 
        // it might be an existing user trying to sign in again
        if (profileError.code !== '23505') {
          // Try to clean up the auth user if profile creation fails
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        }
        
        return NextResponse.json(
          { error: `Failed to create profile: ${profileError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        user: authData.user,
        redirectTo: role === 'runner' ? '/explore' : '/dashboard'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 