import { createClient } from '@/lib/supabase/server'
import SignupForm from '@/components/SignupForm'

export default async function SignupPage() {
  const supabase = await createClient()

  // Fetch all schools from the database
  const { data: schools, error } = await supabase
    .from('schools')
    .select('id, name')
    .order('name')

  if (error) {
    console.error('Error fetching schools:', error)
    console.error('Error details:', error.message, error.code, error.details)
    
    // Fallback schools with actual UUIDs from your database
    const fallbackSchools = [
      { id: '2d760439-19b7-4bb8-bfd6-f50b58f6f869', name: 'Crestview Institute' },
      { id: '30eef75c-dcff-4643-91f2-022901c968dc', name: 'Meridian Prep' },
      { id: '36de9753-098d-41da-bef1-f1282b0f7dcb', name: 'Adams Community School' },
      { id: '3c6abc37-9a5c-4f8a-b1cf-44bb1615d6af', name: 'Hamilton Charter School' },
    ]
    return <SignupForm schools={fallbackSchools} />
  }

  return <SignupForm schools={schools || []} />
}
