# Class Averages Edge Function Deployment Guide

This guide covers deploying and configuring the class averages Edge Function that calculates class averages and saves them to MongoDB.

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ Supabase CLI installed (`npm install -g supabase`)
- ✅ MongoDB database set up (Atlas or self-hosted)
- ✅ Supabase project with the required tables
- ✅ Environment variables configured

## 🚀 Deployment Steps

### 1. Deploy Edge Functions

```bash
# Login to Supabase (if not already logged in)
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the calculate function
supabase functions deploy calculate-class-averages

# Deploy the get function
supabase functions deploy get-class-averages
```

### 2. Set Environment Variables

In your Supabase Dashboard, go to **Settings** → **Edge Functions** and add:

```bash
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Apply Database Migration

```bash
# Apply the automation migration
supabase db push

# Or manually run the migration
psql -h YOUR_DB_HOST -U postgres -d postgres -f supabase/migrations/0005_add_class_averages_automation.sql
```

### 4. Update Configuration Settings

In your Supabase SQL Editor, update the configuration:

```sql
-- Update with your actual Supabase URL
UPDATE app_settings 
SET value = 'https://your-project-ref.supabase.co' 
WHERE key = 'supabase_url';

-- Update with your actual service role key
UPDATE app_settings 
SET value = 'your-service-role-key-here' 
WHERE key = 'service_role_key';
```

## 🧪 Testing the Functions

### Manual Testing

1. **Test Calculation Function:**
```bash
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/calculate-class-averages' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json'
```

2. **Test Retrieval Function:**
```bash
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/get-class-averages' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"period": "2025-09"}'
```

### Using the Test Script

```bash
# Update test-class-averages.js with your credentials
node test-class-averages.js
```

### Frontend Integration

Add the ClassAveragesManager component to your teacher dashboard:

```tsx
import ClassAveragesManager from '@/components/ClassAveragesManager'

// In your TeacherView component
<ClassAveragesManager />
```

## 🔧 Configuration Options

### Automatic Triggers

The function automatically triggers when:
- ✅ New progress data is inserted
- ✅ Existing progress data is updated
- ✅ Progress data is deleted

### Scheduled Execution (Optional)

To enable daily automatic calculation at 2 AM:

```sql
-- Enable pg_cron extension (requires superuser)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily calculation
SELECT cron.schedule(
  'daily-class-averages',
  '0 2 * * *',
  $$SELECT calculate_class_averages_manual();$$
);
```

### Manual Triggering

From your application:

```typescript
import { calculateClassAverages } from '@/lib/classAverages'

const result = await calculateClassAverages()
console.log(result)
```

## 📊 Data Structure

### MongoDB Collection: `class_averages`

```json
{
  "classroomId": "uuid",
  "classroomName": "Math 101",
  "schoolId": "uuid", 
  "averageGrade": 85.5,
  "totalStudents": 25,
  "totalReports": 150,
  "lastCalculated": "2025-09-16T10:30:00Z",
  "period": "2025-09"
}
```

### Supabase Cache Table: `class_averages_cache`

```sql
CREATE TABLE class_averages_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id uuid REFERENCES classrooms(id),
  average_grade decimal(5,2),
  total_students integer,
  total_reports integer,
  last_calculated timestamp with time zone,
  period text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(classroom_id, period)
);
```

## 🔒 Security Considerations

- ✅ Edge Functions use service role key for elevated permissions
- ✅ MongoDB connection uses secure connection string
- ✅ RLS policies protect cache table access
- ✅ Functions validate input parameters
- ✅ Error handling prevents data leakage

## 🐛 Troubleshooting

### Common Issues:

1. **Function deployment fails:**
   - Check Supabase CLI is up to date
   - Verify project linking: `supabase status`

2. **MongoDB connection error:**
   - Verify MONGODB_URL environment variable
   - Check MongoDB Atlas IP whitelist
   - Ensure database user has read/write permissions

3. **Trigger not firing:**
   - Check if pg_net extension is enabled
   - Verify app_settings table has correct URLs
   - Check Supabase logs for trigger errors

4. **No data in calculations:**
   - Ensure progress table has grade data
   - Check if classroom relationships exist
   - Verify RLS policies allow data access

### Debug Commands:

```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'trigger_calculate_class_averages';

-- Check app settings
SELECT * FROM app_settings;

-- Manual function test
SELECT calculate_class_averages_manual();

-- Check recent calculations
SELECT * FROM class_averages_cache ORDER BY last_calculated DESC LIMIT 10;
```

## 📈 Monitoring

Monitor function performance in:
- Supabase Dashboard → Edge Functions → Logs
- MongoDB Atlas → Monitoring → Performance
- Your application analytics

## 🎯 Next Steps

1. Set up monitoring alerts for function failures
2. Implement caching strategies for frequently accessed data
3. Add more granular filtering options (by date range, school, etc.)
4. Create dashboard visualizations for the calculated averages
5. Set up backup strategies for MongoDB data

---

**Need Help?** Check the Supabase Edge Functions documentation or MongoDB Atlas guides for additional support.