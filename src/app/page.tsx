import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // User is authenticated, redirect to dashboard
    redirect('/dashboard')
  } else {
    // User is not authenticated, redirect to login
    redirect('/login')
  }
}
