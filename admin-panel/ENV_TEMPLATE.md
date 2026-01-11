# .env.local Template

Copy this template to create your `.env.local` file:

```env
# Supabase Configuration
# Get these from: Supabase Dashboard > Settings > API

NEXT_PUBLIC_SUPABASE_URL=https://sfukhupkvsjaqkbiskbj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database Connection
# Get this from: Supabase Dashboard > Settings > Database > Connect
# Use "Connection pooling" format
# IMPORTANT: URL-encode special characters in password (@ → %40)

DATABASE_URL=postgresql://postgres.sfukhupkvsjaqkbiskbj:your-password@aws-0-region.pooler.supabase.com:6543/postgres
```

## How to Fill This In:

1. **NEXT_PUBLIC_SUPABASE_URL:**
   - Go to: Settings > API
   - Copy "Project URL"
   - Should look like: `https://sfukhupkvsjaqkbiskbj.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY:**
   - Go to: Settings > API
   - Copy "anon public" key
   - Long string starting with `eyJ...`

3. **SUPABASE_SERVICE_ROLE_KEY:**
   - Go to: Settings > API
   - Copy "service_role" key
   - Long string starting with `eyJ...`
   - ⚠️ Keep this secret!

4. **DATABASE_URL:**
   - Go to: Settings > Database > Connect
   - Select "Connection pooling" tab
   - Copy the connection string
   - Replace `[YOUR-PASSWORD]` with your actual database password
   - **URL-encode special characters:**
     - `@` → `%40`
     - `#` → `%23`
     - `$` → `%24`
   - Replace `region` with your actual region (e.g., `ap-southeast-1`)

## Example with Real Values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://sfukhupkvsjaqkbiskbj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmdWtodXBrdnNqYXFiaXNrYmoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5ODc2ODAwMCwiZXhwIjoyMDE0MzQ0MDAwfQ.example
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmdWtodXBrdnNqYXFiaXNrYmoiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjk4NzY4MDAwLCJleHAiOjIwMTQzNDQwMDB9.example

DATABASE_URL=postgresql://postgres.sfukhupkvsjaqkbiskbj:MyPass%40123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

## Quick Setup:

Run this command to set up interactively:
```bash
npm run setup:env
```

Or manually create `.env.local` file in the `admin-panel` directory with the template above.



