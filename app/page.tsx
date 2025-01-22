'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './context/AuthContext'
import Login from '@/components/Login'

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/Inicio')
    }
  }, [user, router])

  // If user is not null, we're either logged in or still checking.
  // In either case, we don't want to show anything yet.
  if (user !== null) {
    return null // or a loading spinner
  }

  // If user is null, we're definitely not logged in, so show the login page
  return (
    <>
      <Login />
    </>
  )
}