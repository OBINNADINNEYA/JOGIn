-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table first (this references auth.users which is created by Supabase)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('runner', 'leader')),
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create run_clubs table
CREATE TABLE IF NOT EXISTS run_clubs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create run_club_posts table
CREATE TABLE IF NOT EXISTS run_club_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id UUID REFERENCES run_clubs(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create run_club_memberships table
CREATE TABLE IF NOT EXISTS run_club_memberships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id UUID REFERENCES run_clubs(id) ON DELETE CASCADE NOT NULL,
  runner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(club_id, runner_id)
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'pro')),
  user_type TEXT NOT NULL CHECK (user_type IN ('runner', 'leader')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_club_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

DROP POLICY IF EXISTS "Run clubs are viewable by everyone" ON run_clubs;
DROP POLICY IF EXISTS "Leaders can create run clubs" ON run_clubs;
DROP POLICY IF EXISTS "Leaders can update own run clubs" ON run_clubs;
DROP POLICY IF EXISTS "Leaders can delete own run clubs" ON run_clubs;

DROP POLICY IF EXISTS "Members can view club posts" ON run_club_posts;
DROP POLICY IF EXISTS "Leaders can create posts for their clubs" ON run_club_posts;
DROP POLICY IF EXISTS "Authors can update their posts" ON run_club_posts;
DROP POLICY IF EXISTS "Authors can delete their posts" ON run_club_posts;

DROP POLICY IF EXISTS "Members can view club memberships" ON run_club_memberships;
DROP POLICY IF EXISTS "Runners can join clubs" ON run_club_memberships;
DROP POLICY IF EXISTS "Members can leave clubs" ON run_club_memberships;
DROP POLICY IF EXISTS "Leaders can remove members" ON run_club_memberships;

DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscription" ON subscriptions;

-- Create policies

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- Run clubs policies
CREATE POLICY "Run clubs are viewable by everyone"
  ON run_clubs FOR SELECT
  USING (true);

CREATE POLICY "Leaders can create run clubs"
  ON run_clubs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'leader'
    )
  );

CREATE POLICY "Leaders can update own run clubs"
  ON run_clubs FOR UPDATE
  USING (leader_id = auth.uid());

CREATE POLICY "Leaders can delete own run clubs"
  ON run_clubs FOR DELETE
  USING (leader_id = auth.uid());

-- Run club posts policies
CREATE POLICY "Members can view club posts"
  ON run_club_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM run_club_memberships
      WHERE club_id = run_club_posts.club_id
      AND runner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM run_clubs
      WHERE id = run_club_posts.club_id
      AND leader_id = auth.uid()
    )
  );

CREATE POLICY "Leaders can create posts for their clubs"
  ON run_club_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM run_clubs
      WHERE id = club_id
      AND leader_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update their posts"
  ON run_club_posts FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Authors can delete their posts"
  ON run_club_posts FOR DELETE
  USING (author_id = auth.uid());

-- Run club memberships policies
CREATE POLICY "Members can view club memberships"
  ON run_club_memberships FOR SELECT
  USING (
    runner_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM run_clubs
      WHERE id = club_id
      AND leader_id = auth.uid()
    )
  );

CREATE POLICY "Runners can join clubs"
  ON run_club_memberships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'runner'
    )
    AND runner_id = auth.uid()
  );

CREATE POLICY "Members can leave clubs"
  ON run_club_memberships FOR DELETE
  USING (runner_id = auth.uid());

CREATE POLICY "Leaders can remove members"
  ON run_club_memberships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM run_clubs
      WHERE id = club_id
      AND leader_id = auth.uid()
    )
  );

-- Subscriptions policies
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own subscription"
  ON subscriptions FOR DELETE
  USING (user_id = auth.uid());

-- Create functions and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON profiles;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan_type, user_type)
  VALUES (
    NEW.id,
    'free',
    (SELECT role FROM profiles WHERE id = NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE PROCEDURE handle_new_user(); 