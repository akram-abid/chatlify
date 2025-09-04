import { loginSchema, registerSchema } from '@/lib/validations/user';
import React from 'react';
import { FcGoogle } from 'react-icons/fc';

type FormType = 'sign-in' | 'sign-up';

const AuthForm = ({ type }: { type: FormType }) => {
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const values = Object.fromEntries(formData.entries());

    if (type === 'sign-in') {
      const result = loginSchema.safeParse(values);
      if (result.success) {
        console.log('Valid login:', result.data);
        // Handle successful login
      } else {
        console.log('Validation errors:', result.error.issues);
        // Handle validation errors
      }
    } else {
      const result = registerSchema.safeParse(values);
      if (result.success) {
        console.log('Valid registration:', result.data);
        // Handle successful registration
      } else {
        console.log('Validation errors:', result.error.issues);
        // Handle validation errors
      }
    }
  };

  return (
    <form onSubmit={onSubmit} className="auth-form">
      {type === 'sign-up' ? (
        <>
          <input 
            className="input" 
            type="text" 
            name="name"
            placeholder="Name" 
            required 
          />
          <input
            className="input"
            type="email"
            name="email"
            placeholder="Email"
            required
          />
          <input
            className="input"
            type="password"
            name="password"
            placeholder="Password"
            required
          />
          <button className="primary-btn mt-4" type="submit">
            Sign Up
          </button>
        </>
      ) : (
        <>
          <input
            className="input"
            type="email"
            name="email"
            placeholder="Email"
            required
          />
          <input
            className="input"
            type="password"
            name="password"
            placeholder="Password"
            required
          />
          <button className="primary-btn mt-4" type="submit">
            Sign In
          </button>
        </>
      )}
      
      <button
        className="flex gap-3 items-center justify-center secondary-btn"
        type="button"
      >
        <FcGoogle size={30} />
        Continue with Google
      </button>
    </form>
  );
};

export default AuthForm;