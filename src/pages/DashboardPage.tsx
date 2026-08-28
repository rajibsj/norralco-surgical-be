import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: orders } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      return orders ?? [];
    },
    enabled: !!user,
  });

  return (
    <PageLayout>
      <PageLayout.Header>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </PageLayout.Header>

      <PageLayout.Content>
        {!user && <div>Please sign in to view your dashboard.</div>}

        {user && (
          <>
            <Card className="p-4 mb-4">
              <h3 className="font-medium">Profile</h3>
              <div className="text-sm text-muted-foreground">Email: {user.email}</div>
            </Card>

            <Card className="p-4">
              <h3 className="font-medium mb-2">Order history</h3>

              {isLoading && <Skeleton className="h-40 w-full" />}

              {error && <div className="text-red-600">Failed to load orders.</div>}

              {!isLoading && data && data.length === 0 && <div>No orders yet.</div>}

              {!isLoading && data && data.length > 0 && (
                <ul className="space-y-3">
                  {data.map((o: any) => (
                    <li key={o.id} className="border rounded p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Order {o.id}</div>
                          <div className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                        </div>
                        <div className="text-sm font-medium">{o.status}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </PageLayout.Content>
    </PageLayout>
  );
}
