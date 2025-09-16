# Quick Development Setup Instructions:

1. Go to https://supabase.com/dashboard
2. Select your project: qfsadbwvdjexsbcyiwxt  
3. Go to Settings → API
4. Copy the "anon public" key
5. Paste it in .env.local for both NEXT_PUBLIC_SUPABASE_ANON_KEY and temporarily for SUPABASE_SERVICE_ROLE_KEY
6. For MongoDB, you'll need to update the password

Example .env.local format:
NEXT_PUBLIC_SUPABASE_URL=https://qfsadbwvdjexsbcyiwxt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_actual_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_actual_service_role_key_here
MONGODB_URL=mongodb+srv://username:newpassword@cluster0.hkch0e9.mongodb.net/rls_guard_dog?retryWrites=true&w=majority&appName=Cluster0