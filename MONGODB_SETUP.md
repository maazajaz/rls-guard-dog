# RLS Guard Dog - MongoDB Integration Setup

## Overview

This application now includes complete MongoDB integration for storing and displaying class averages calculated by a Supabase Edge Function. Here's what has been implemented:

## ✅ What's Complete

### 1. **Supabase Database Structure**
- ✅ Classroom and Progress tables linked by school_id
- ✅ Complete Row Level Security (RLS) policies:
  - Students see only their own records
  - Teachers see records for their assigned classrooms
  - Head teachers see all records in their school
- ✅ Protected /teacher page for editing progress
- ✅ User authentication and role management

### 2. **MongoDB Integration**
- ✅ MongoDB connection utility (`src/lib/mongodb.ts`)
- ✅ ClassAverages component for displaying data
- ✅ API routes for fetching averages and triggering recalculation
- ✅ Integration in HeadTeacherView and TeacherView components

### 3. **Supabase Edge Function**
- ✅ `calculate-class-averages` Edge Function created
- ✅ Database triggers for automatic calculation
- ✅ MongoDB schema for storing class averages with grade distribution

## 🔧 Setup Required

### 1. **MongoDB Setup**
1. Create a MongoDB Atlas account (free tier available)
2. Create a new cluster and database named `rls_guard_dog`
3. Get your connection string and update `.env.local`:
   ```
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/rls_guard_dog?retryWrites=true&w=majority
   ```

### 2. **Supabase Service Role Key**
1. Go to your Supabase project settings
2. Find your service role key (starts with `eyJ...`)
3. Update `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
   ```

### 3. **Deploy Edge Function**
1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref your-project-ref`
4. Deploy function: `supabase functions deploy calculate-class-averages`

### 4. **Setup Database Triggers**
Run this SQL in your Supabase SQL editor:
```sql
-- Update the URLs in the trigger function
UPDATE public.functions 
SET url = 'https://your-project-ref.supabase.co/functions/v1/calculate-class-averages'
WHERE name = 'trigger_class_average_calculation';
```

### 5. **Run Database Migration**
Execute the SQL files in the `supabase/migrations/` folder:
- `0001_initial_schema.sql` (if not already run)
- `0002_add_mongodb_triggers.sql`

## 🎯 Features

### **MongoDB Class Averages**
- Real-time calculation when progress is added/updated
- Grade distribution (Excellent, Good, Satisfactory, Needs Improvement)
- School-wide statistics for head teachers
- Classroom-specific averages for teachers

### **Automatic Triggers**
- Progress INSERT/UPDATE/DELETE triggers Edge Function
- Edge Function calculates averages and saves to MongoDB
- UI displays data from MongoDB with real-time updates

### **Manual Recalculation**
- "Recalculate" button for manual triggers
- API endpoint for programmatic recalculation
- Useful for testing and data integrity

## 📊 Data Flow

1. **Teacher adds progress** → Supabase `progress` table
2. **Database trigger fires** → Calls Edge Function
3. **Edge Function calculates** → Class averages and statistics
4. **Saves to MongoDB** → `class_averages` collection
5. **UI displays** → Real-time averages from MongoDB

## 🧪 Testing

1. Add some students and teachers to your school
2. Create classrooms and assign teachers
3. Add progress reports
4. Watch the class averages update in MongoDB
5. View averages in the HeadTeacher and Teacher dashboards

## 📁 Key Files

- `src/lib/mongodb.ts` - MongoDB connection and utilities
- `src/components/ClassAverages.tsx` - UI component for displaying averages
- `supabase/functions/calculate-class-averages/index.ts` - Edge Function
- `src/app/api/class-averages/route.ts` - API for fetching averages
- `src/app/api/recalculate-averages/route.ts` - API for manual recalculation

## 🔍 MongoDB Collection Schema

```javascript
{
  "_id": ObjectId,
  "classroom_id": "uuid",
  "classroom_name": "string",
  "school_id": "uuid", 
  "average_grade": number,
  "total_students": number,
  "total_reports": number,
  "last_updated": Date,
  "grade_distribution": {
    "excellent": number,      // 90-100
    "good": number,          // 80-89
    "satisfactory": number,  // 70-79
    "needs_improvement": number // below 70
  }
}
```

## 🚀 Next Steps

Once you complete the setup above, your application will have:
- ✅ Complete Supabase RLS implementation
- ✅ MongoDB integration for analytics
- ✅ Edge Function for real-time calculations
- ✅ Modern Next.js interface
- ✅ All original requirements fulfilled!

The system now meets all your specified tech requirements: **Supabase RLS**, **Supabase Auth**, **Next.js**, and **MongoDB** with automatic class average calculations.
