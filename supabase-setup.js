// Supabase Configuration
const SUPABASE_URL = 'https://duounhrrqtpfuhugrcyo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vFF0trsprN0Jy3N7JImKmg_2JlMOle0';

try {
    // Initialize the Supabase Client
    if (window.supabase) {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase Client Initialized");
    } else {
        console.error("Supabase CDN failed to load.");
    }
} catch (error) {
    console.error("Error initializing Supabase:", error);
}
