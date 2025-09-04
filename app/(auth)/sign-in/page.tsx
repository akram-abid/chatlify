import AuthForm from '@/components/AuthForm'
import Link from 'next/link'
import React from 'react'

const Page = () => {
  return (
    <>
      <h2 className="h3 mt-4">sign in</h2>
      <AuthForm type='sign-in'/>
      <h5 className='body-1'>New to Chatlify? <Link href="/sign-up" className='text-primary'>Sign up</Link></h5>
    </>
  )
}

export default Page