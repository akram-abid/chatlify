import Image from 'next/image'
import React from 'react'

const Layout = ({ children } : { children: React.ReactNode }) => {
  return (
    <div className='h-screen flex-center flex-col bg-surface'>
        <div className="card w-[446px]">
            <Image src="/logo.png" alt="logo" width={80} height={80} />
            <h1 className="h1 tracking-wide text-primary">Chatlify</h1>
          {children}
        </div>
    </div>
  )
}

export default Layout