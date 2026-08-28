import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { useState } from 'react';

export default function FaqPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['static_faq'],
    queryFn: async () => {
      const { data } = await supabase.from('static_content').select('*').eq('slug', 'faq').single();
      return data;
    },
  });

  const content = data?.content ?? null;
  // For demo we parse content into sections by heading lines if available.
  const sections = content ? content.split('\n\n').slice(0, 10) : [];

  return (
    <PageLayout>
      <PageLayout.Header>
        <h1 className="text-2xl font-semibold">FAQ</h1>
      </PageLayout.Header>

      <PageLayout.Content>
        {isLoading && <Card className="p-6">Loading...</Card>}

        {!isLoading && !content && (
          <Card className="p-6">No FAQ content available. Admins can create a static_content entry with slug "faq".</Card>
        )}

        {!isLoading && content && (
          <div className="space-y-4">
            {sections.map((s: string, i: number) => (
              <Card key={i} className="p-4">
                <div dangerouslySetInnerHTML={{ __html: s.replace(/\n/g, '<br/>') }} />
              </Card>
            ))}
          </div>
        )}
      </PageLayout.Content>
    </PageLayout>
  );
}
