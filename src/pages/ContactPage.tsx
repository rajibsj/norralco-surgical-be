import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().optional(),
  message: z.string().min(5),
});

type FormValues = z.infer<typeof schema>;

export default function ContactPage() {
  const { register, handleSubmit, reset } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: FormValues) => {
    setStatus('submitting');
    setError(null);
    try {
      const { error: e } = await supabase.from('contact_submissions').insert(values);
      if (e) throw e;
      setStatus('success');
      reset();
    } catch (err: any) {
      setError(err.message ?? 'Failed to submit');
      setStatus('error');
    }
  };

  return (
    <PageLayout>
      <PageLayout.Header>
        <h1 className="text-2xl font-semibold">Contact Us</h1>
      </PageLayout.Header>

      <PageLayout.Content>
        <Card className="p-6 max-w-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <label className="text-sm block mb-1">Name</label>
              <Input {...register('name')} />
            </div>

            <div>
              <label className="text-sm block mb-1">Email</label>
              <Input {...register('email')} />
            </div>

            <div>
              <label className="text-sm block mb-1">Subject</label>
              <Input {...register('subject')} />
            </div>

            <div>
              <label className="text-sm block mb-1">Message</label>
              <textarea {...register('message')} rows={6} className="w-full border rounded p-2" />
            </div>

            {status === 'success' && <div className="text-green-600">Message sent. We'll get back to you soon.</div>}
            {status === 'error' && <div className="text-red-600">{error}</div>}

            <div>
              <Button type="submit" disabled={status === 'submitting'}>{status === 'submitting' ? 'Sending...' : 'Send message'}</Button>
            </div>
          </form>
        </Card>
      </PageLayout.Content>
    </PageLayout>
  );
}
