import { createClient } from '@/lib/supabase/server'
import StudentView from '@/components/StudentView'
import TeacherView from '@/components/TeacherView'
import HeadTeacherView from '@/components/HeadTeacherView'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const handleSignOut = async () => {
    'use server'
    const supabase = createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  const renderView = () => {
    switch (profile?.role) {
      case 'student':
        return <StudentView />
      case 'teacher':
        return <TeacherView />
      case 'head_teacher':
        return <HeadTeacherView />
      default:
        return <p>You do not have a role assigned.</p>
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl">Hello, {user.email}</h1>
        <form action={handleSignOut}>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        </form>
      </div>
      {renderView()}
    </div>
  )
}
