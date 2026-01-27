'use client';

import React from 'react';
import { FcGoogle } from 'react-icons/fc';
import { BeatLoader } from 'react-spinners';
import { loginSchema, registerSchema } from '../lib/validations/user';
import { useRouter } from 'next/navigation';

async function authRequest(endpoint, data) {
  const res = await fetch(`/api/auth/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Something went wrong');
  }
  return json;
}

const AuthForm = ({ type }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const router = useRouter();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const values = Object.fromEntries(formData.entries());

    const schema = type === 'sign-in' ? loginSchema : registerSchema;
    const result = schema.safeParse(values);

    if (!result.success) {
      setErrorMessage(
        result.error.issues.map((issue) => issue.message).join(', ')
      );
      setIsLoading(false);
      return;
    }

    try {
      const data = await authRequest(
        type === 'sign-in' ? 'signin' : 'signup',
        result.data
      );
      console.log(`${type} successful:`, data);
      router.replace('/');
    } catch (err) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="auth-form">
      {type === 'sign-up' && (
        <input
          className="input"
          type="text"
          name="name"
          placeholder="Name"
          onChange={() => setErrorMessage('')}
          required
        />
      )}

      <input
        className="input"
        type="email"
        name="email"
        placeholder="Email"
        onChange={() => setErrorMessage('')}
        required
      />
      <input
        className="input"
        type="password"
        name="password"
        placeholder="Password"
        onChange={() => setErrorMessage('')}
        required
      />

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <button
        className="primary-btn mt-4 flex-center"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? (
          <BeatLoader color="#ffffff" className="py-1" size={12} />
        ) : type === 'sign-in' ? (
          'Sign In'
        ) : (
          'Sign Up'
        )}
      </button>

      <button
        className="flex gap-3 items-center justify-center secondary-btn"
        type="button"
        onClick={() => console.log('Google OAuth flow')}
      >
        <FcGoogle size={30} />
        Continue with Google
      </button>
    </form>
  );
};

export default AuthForm;
