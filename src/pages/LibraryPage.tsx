import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function LibraryPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['mediaLibrary'],
    queryFn: async () => {
      const { data } = await supabase.from('media_library').select('*').order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  return (
    <PageLayout>
      <PageLayout.Header>
        <h1 className="text-2xl font-semibold">Downloads & Videos</h1>
      </PageLayout.Header>

      <PageLayout.Content>
        {isLoading && <Skeleton className="h-40 w-full" />}

        {error && <div className="text-red-600">Failed to load library.</div>}

        {!isLoading && data && data.length === 0 && <div>No media available.</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map((m: any) => (
            <Card key={m.id} className="p-4">
              <div className="font-medium">{m.title}</div>
              <div className="text-sm text-muted-foreground mb-2">{m.type.toUpperCase()}</div>
              <a className="text-sm underline" href={m.url} target="_blank" rel="noreferrer">Open</a>
            </Card>
          ))}
        </div>
      </PageLayout.Content>
    </PageLayout>
  );
}
