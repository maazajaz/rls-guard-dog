'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type User = {
  id: string
  full_name: string | null
  role: 'student' | 'teacher' | 'head_teacher'
}

type RoleManagementProps = {
  users: User[]
}

export default function RoleManagement({ users }: RoleManagementProps) {
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | 'head_teacher'>('student')
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRoleChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !selectedRole) return

    setIsUpdating(true)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', selectedUser)

      if (error) {
        console.error('Error updating role:', error)
        alert('Failed to update role: ' + error.message)
      } else {
        setSelectedUser('')
        setSelectedRole('student')
        router.refresh()
        alert('User role updated successfully!')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An unexpected error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  const selectedUserData = users.find(user => user.id === selectedUser)

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl shadow-xl border border-white/10 p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl flex items-center justify-center mr-3 shadow-xl">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Role Management</h3>
          <p className="text-gray-200 text-sm">Change user roles in your school</p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-gray-200 mb-2">No Users Available</h4>
          <p className="text-gray-300">There are no users in your school yet.</p>
        </div>
      ) : (
        <form onSubmit={handleRoleChange} className="space-y-6">
          <div>
            <label htmlFor="user" className="block text-sm font-semibold text-gray-200 mb-2">
              Select User
            </label>
            <select
              id="user"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              required
              className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 bg-white/10 backdrop-blur-sm text-white"
            >
              <option value="" className="bg-gray-800 text-gray-200">Choose a user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id} className="bg-gray-800 text-gray-200">
                  {user.full_name || 'Unnamed User'} - Current: {user.role.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {selectedUserData && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <h4 className="text-sm font-semibold text-gray-200 mb-2">Selected User Details</h4>
              <div className="space-y-1">
                <p className="text-white font-medium">{selectedUserData.full_name || 'Unnamed User'}</p>
                <p className="text-gray-300 text-sm">Current Role: 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                    selectedUserData.role === 'head_teacher' ? 'bg-purple-500/30 text-purple-300 border border-purple-400/30' :
                    selectedUserData.role === 'teacher' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/30' :
                    'bg-blue-500/30 text-blue-300 border border-blue-400/30'
                  }`}>
                    {selectedUserData.role.replace('_', ' ').toUpperCase()}
                  </span>
                </p>
              </div>
            </div>
          )}
          
          <div>
            <label htmlFor="role" className="block text-sm font-semibold text-gray-200 mb-2">
              New Role
            </label>
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as 'student' | 'teacher' | 'head_teacher')}
              required
              className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 bg-white/10 backdrop-blur-sm text-white"
            >
              <option value="student" className="bg-gray-800 text-gray-200">Student</option>
              <option value="teacher" className="bg-gray-800 text-gray-200">Teacher</option>
              <option value="head_teacher" className="bg-gray-800 text-gray-200">Head Teacher</option>
            </select>
          </div>
          
          <button
            type="submit"
            disabled={isUpdating || !selectedUser || !selectedRole}
            className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 font-semibold"
          >
            {isUpdating ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating Role...
              </div>
            ) : (
              'Update User Role'
            )}
          </button>
        </form>
      )}
    </div>
  )
}
