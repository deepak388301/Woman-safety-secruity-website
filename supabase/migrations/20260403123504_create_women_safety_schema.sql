/*
  # Women's Safety Platform Schema

  1. New Tables
    - `user_profiles` - Extended user profile information
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `phone` (text)
      - `emergency_contacts` (jsonb array)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `trusted_contacts` - User's trusted emergency contacts
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `contact_name` (text)
      - `contact_phone` (text)
      - `contact_email` (text)
      - `relationship` (text)
      - `created_at` (timestamp)

    - `emergency_alerts` - Emergency alert records
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `latitude` (decimal)
      - `longitude` (decimal)
      - `alert_type` (text)
      - `message` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `resolved_at` (timestamp)

    - `safety_incidents` - Community reported incidents
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `latitude` (decimal)
      - `longitude` (decimal)
      - `incident_type` (text)
      - `description` (text)
      - `severity` (text)
      - `verified` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `safety_resources` - Safety tips and resources
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `category` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own profiles and data
    - Users can view public safety incidents and resources

  3. Indexes
    - Index on user_id for faster queries
    - Index on coordinates for spatial queries
    - Index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  phone text,
  emergency_contacts jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS trusted_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles ON DELETE CASCADE,
  contact_name text NOT NULL,
  contact_phone text,
  contact_email text,
  relationship text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trusted_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trusted contacts"
  ON trusted_contacts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own trusted contacts"
  ON trusted_contacts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own trusted contacts"
  ON trusted_contacts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own trusted contacts"
  ON trusted_contacts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS emergency_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles ON DELETE CASCADE,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  alert_type text NOT NULL,
  message text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON emergency_alerts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create alerts"
  ON emergency_alerts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own alerts"
  ON emergency_alerts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS safety_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles ON DELETE SET NULL,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  incident_type text NOT NULL,
  description text,
  severity text DEFAULT 'medium',
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE safety_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view safety incidents"
  ON safety_incidents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can report incidents"
  ON safety_incidents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own incidents"
  ON safety_incidents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS safety_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE safety_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view safety resources"
  ON safety_resources FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX idx_trusted_contacts_user_id ON trusted_contacts(user_id);
CREATE INDEX idx_emergency_alerts_user_id ON emergency_alerts(user_id);
CREATE INDEX idx_emergency_alerts_created ON emergency_alerts(created_at DESC);
CREATE INDEX idx_safety_incidents_created ON safety_incidents(created_at DESC);
CREATE INDEX idx_safety_incidents_severity ON safety_incidents(severity);
