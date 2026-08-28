import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState } from 'react';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    if (values.password !== values.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const res = await signUp(values.email, values.password);
      if (res?.error) {
        setError(res.error.message ?? 'Failed to create account');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to create account');
    }
  };

  return (
    <PageLayout>
      <PageLayout.Content>
        <div className="max-w-md mx-auto">
          <Card className="p-6">
            <h2 className="text-xl font-medium mb-4">Create account</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="text-sm block mb-1">Email</label>
                <Input {...register('email')} />
              </div>

              <div>
                <label className="text-sm block mb-1">Password</label>
                <Input type="password" {...register('password')} />
              </div>

              <div>
                <label className="text-sm block mb-1">Confirm password</label>
                <Input type="password" {...register('confirmPassword')} />
              </div>

              {error && <div className="text-red-600">{error}</div>}

              <div className="flex items-center gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating account...' : 'Register'}
                </Button>
                <Link to="/login" className="text-sm text-muted-foreground">
                  Already have an account?
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </PageLayout.Content>
    </PageLayout>
  );
}
