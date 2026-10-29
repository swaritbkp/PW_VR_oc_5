'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { z } from 'zod';

const SignInSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export interface UseSignIn {
  readonly email: string;
  readonly setEmail: (value: string) => void;
  readonly password: string;
  readonly setPassword: (value: string) => void;
  readonly error: string | null;
  readonly setError: (value: string | null) => void;
  readonly submitting: boolean;
  readonly handleSubmit: (event: React.FormEvent) => Promise<void>;
}

/** Hook managing email/password sign-in state and submission. */
export function useSignIn(): UseSignIn {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    const parsed = SignInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError('Enter a valid email and password');
      return;
    }
    setSubmitting(true);
    try {
      const result = await signIn('credentials', {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });
      if (result?.error) {
        setError('Invalid email or password');
      } else {
        window.location.href = '/';
      }
    } catch {
      setError('Sign-in failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return { email, setEmail, password, setPassword, error, setError, submitting, handleSubmit };
}
