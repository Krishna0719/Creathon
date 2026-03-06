-- SQL Query to create the Wide-Table structure for easy CSV Exporting in Supabase
-- Run this directly in the Supabase Dashboard -> SQL Editor

CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Team Information
    team_name TEXT NOT NULL,
    
    -- Leader Information
    leader_name TEXT NOT NULL,
    leader_roll TEXT NOT NULL UNIQUE,
    leader_email TEXT NOT NULL,
    leader_year TEXT NOT NULL,
    leader_section TEXT NOT NULL,
    
    -- Member 1 (Required)
    member1_name TEXT NOT NULL,
    member1_roll TEXT NOT NULL UNIQUE,
    member1_year TEXT NOT NULL,
    member1_section TEXT NOT NULL,
    member1_email TEXT NOT NULL,
    
    -- Member 2 (Required)
    member2_name TEXT NOT NULL,
    member2_roll TEXT NOT NULL UNIQUE,
    member2_year TEXT NOT NULL,
    member2_section TEXT NOT NULL,
    member2_email TEXT NOT NULL,
    
    -- Member 3 (Optional)
    member3_name TEXT,
    member3_roll TEXT UNIQUE,
    member3_year TEXT,
    member3_section TEXT,
    member3_email TEXT,
    
    -- Member 4 (Optional)
    member4_name TEXT,
    member4_roll TEXT UNIQUE,
    member4_year TEXT,
    member4_section TEXT,
    member4_email TEXT
);
