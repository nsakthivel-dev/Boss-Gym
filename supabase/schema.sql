-- ============================================================
-- NEW BOSS GYM — QR + GPS GEOFENCED ATTENDANCE SYSTEM SCHEMA
-- ============================================================
-- Safe, non-destructive migration. 
-- Preserves existing tables and storage.
-- Run this in your Supabase SQL Editor.

-- 1. GYM LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS public.gym_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL DEFAULT 'New Boss Gym',
    latitude DOUBLE PRECISION NOT NULL DEFAULT 11.9111586,
    longitude DOUBLE PRECISION NOT NULL DEFAULT 79.6347447,
    geofence_radius INTEGER NOT NULL DEFAULT 50, -- in meters (configurable)
    address TEXT DEFAULT 'No:22, Gayathiri Nagar, 100ft Road, Muthaliyarpet, Pondicherry – 605004',
    phone VARCHAR(50) DEFAULT '+91 98765 43210',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. ATTENDANCE QR CODES TABLE
CREATE TABLE IF NOT EXISTS public.attendance_qr (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID REFERENCES public.gym_locations(id) ON DELETE CASCADE,
    secure_token VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'revoked', 'expired'
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. ATTENDANCE SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id VARCHAR(255) NOT NULL,
    member_name VARCHAR(255) NOT NULL,
    gym_id UUID REFERENCES public.gym_locations(id) ON DELETE SET NULL,
    qr_id UUID REFERENCES public.attendance_qr(id) ON DELETE SET NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    entry_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    exit_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'open', -- 'open', 'closed', 'no-exit'
    check_in_latitude DOUBLE PRECISION,
    check_in_longitude DOUBLE PRECISION,
    check_in_accuracy DOUBLE PRECISION,
    check_in_distance DOUBLE PRECISION,
    check_out_latitude DOUBLE PRECISION,
    check_out_longitude DOUBLE PRECISION,
    check_out_accuracy DOUBLE PRECISION,
    check_out_distance DOUBLE PRECISION,
    device_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. ATTENDANCE AUDIT EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id VARCHAR(255),
    session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- 'check_in', 'check_out', 'scan_rejected'
    qr_token VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    accuracy DOUBLE PRECISION,
    calculated_distance DOUBLE PRECISION,
    location_verified BOOLEAN DEFAULT false,
    rejection_reason VARCHAR(255),
    device_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. HAVERSINE DISTANCE HELPER FUNCTION IN POSTGRES
CREATE OR REPLACE FUNCTION public.calculate_haversine_distance(
    lat1 DOUBLE PRECISION,
    lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    r CONSTANT DOUBLE PRECISION := 6371000; -- Earth radius in meters
    phi1 DOUBLE PRECISION;
    phi2 DOUBLE PRECISION;
    delta_phi DOUBLE PRECISION;
    delta_lambda DOUBLE PRECISION;
    a DOUBLE PRECISION;
    c DOUBLE PRECISION;
BEGIN
    phi1 := radians(lat1);
    phi2 := radians(lat2);
    delta_phi := radians(lat2 - lat1);
    delta_lambda := radians(lon2 - lon1);

    a := sin(delta_phi / 2.0) * sin(delta_phi / 2.0) +
         cos(phi1) * cos(phi2) *
         sin(delta_lambda / 2.0) * sin(delta_lambda / 2.0);
    c := 2.0 * atan2(sqrt(a), sqrt(1.0 - a));

    RETURN r * c;
END;
$$;

-- 6. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_sessions_member_date ON public.attendance_sessions(member_id, session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.attendance_sessions(status);
CREATE INDEX IF NOT EXISTS idx_attendance_qr_token ON public.attendance_qr(secure_token);
CREATE INDEX IF NOT EXISTS idx_events_member_type ON public.attendance_events(member_id, event_type);

-- 7. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.gym_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_qr ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_events ENABLE ROW LEVEL SECURITY;

-- Allow read of gym location and active QR to public/authenticated
CREATE POLICY "Allow public read active gym_locations" ON public.gym_locations
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read active attendance_qr" ON public.attendance_qr
    FOR SELECT USING (status = 'active');

-- Allow insert and read of sessions
CREATE POLICY "Allow anon insert attendance_sessions" ON public.attendance_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select own attendance_sessions" ON public.attendance_sessions
    FOR SELECT USING (true);

CREATE POLICY "Allow update own attendance_sessions" ON public.attendance_sessions
    FOR UPDATE USING (status = 'open');

CREATE POLICY "Allow anon insert attendance_events" ON public.attendance_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select attendance_events" ON public.attendance_events
    FOR SELECT USING (true);

-- Admin full access if authenticated
CREATE POLICY "Admin full access gym_locations" ON public.gym_locations
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Admin full access attendance_qr" ON public.attendance_qr
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Admin full access attendance_sessions" ON public.attendance_sessions
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Admin full access attendance_events" ON public.attendance_events
    FOR ALL TO authenticated USING (true);
