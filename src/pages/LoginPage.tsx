import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState } from 'react';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') ?? '/dashboard';
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const res = await signIn(values.email, values.password);
      if (res?.error) {
        setError(res.error.message ?? 'Failed to sign in');
      } else {
        navigate(returnTo);
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to sign in');
    }
  };

  return (
    <PageLayout>
      <PageLayout.Content>
        <div className="max-w-md mx-auto">
          <Card className="p-6">
            <h2 className="text-xl font-medium mb-4">Sign in</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="text-sm block mb-1">Email</label>
                <Input {...register('email')} />
              </div>

              <div>
                <label className="text-sm block mb-1">Password</label>
                <Input type="password" {...register('password')} />
              </div>

              {error && <div className="text-red-600">{error}</div>}

              <div className="flex items-center gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </Button>
                <Link to="/forgot-password" className="text-sm text-muted-foreground">
                  Forgot password?
                </Link>
              </div>

              <div className="text-sm text-muted-foreground">
                Don't have an account? <Link to="/register" className="underline">Register</Link>
              </div>
            </form>
          </Card>
        </div>
      </PageLayout.Content>
    </PageLayout>
  );
}
