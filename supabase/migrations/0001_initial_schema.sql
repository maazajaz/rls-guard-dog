-- 1. Create custom types
create type public.user_role as enum ('student', 'teacher', 'head_teacher');

-- 2. Create tables
create table public.schools (
  id uuid default gen_random_uuid() primary key,
  name text not null
);

create table public.classrooms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  school_id uuid references public.schools(id) on delete cascade not null
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null,
  school_id uuid references public.schools(id) on delete cascade not null
);

create table public.classroom_teachers (
  classroom_id uuid references public.classrooms(id) on delete cascade not null,
  teacher_id uuid references public.profiles(id) on delete cascade not null,
  primary key (classroom_id, teacher_id)
);

create table public.progress (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  classroom_id uuid references public.classrooms(id) on delete cascade not null,
  report_date date not null default now(),
  grade integer not null check (grade >= 0 and grade <= 100),
  feedback text
);

-- 3. Enable RLS on tables with sensitive data
alter table public.profiles enable row level security;
alter table public.progress enable row level security;

-- 4. Create RLS policies for the 'profiles' table
create policy "Users can view profiles in their own school"
  on public.profiles for select
  using (school_id = (select school_id from public.profiles where id = auth.uid()));

-- 5. Create RLS policies for the 'progress' table
create policy "Students can view their own progress"
  on public.progress for select
  using (student_id = auth.uid());

create policy "Teachers can view progress for students in their classes"
  on public.progress for select
  using (
    classroom_id in (
      select classroom_id from public.classroom_teachers where teacher_id = auth.uid()
    )
  );

create policy "Head teachers can view all progress in their school"
  on public.progress for select
  using (
    (select school_id from public.profiles where id = student_id) = (select school_id from public.profiles where id = auth.uid())
  );

create policy "Teachers can insert progress for students in their classes"
  on public.progress for insert
  with check (
    classroom_id in (
      select classroom_id from public.classroom_teachers where teacher_id = auth.uid()
    )
  );