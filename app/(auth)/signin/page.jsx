import Link from 'next/link'
import AuthForm from '../../../components/AuthForm'

const Page = () => {
  return (
    <>
      <h2 className="h3">sign in</h2>
      <AuthForm type='sign-in'/>
      <h5 className='body-1'>New to Chatlify? <Link href="/signup" className='text-primary'>Sign up</Link></h5>
    </>
  )
}

export default Page