import AuthForm from '@/components/AuthForm'
import Link from 'next/link'
import React from 'react'

const Page = () => {

  return (
    <>
      <h2 className="h3">Sign up</h2>
      <AuthForm type='sign-up'/>
      <h5 className='body-1'>Already have an account? <Link href="/sign-in" className='text-primary'>Sign in</Link></h5>
    </>
  )
}

export default Page