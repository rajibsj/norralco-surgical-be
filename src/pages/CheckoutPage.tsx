import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function CheckoutPage() {
  const cart = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard: require auth to checkout
  React.useEffect(() => {
    if (!user) {
      navigate('/login?returnTo=/checkout');
    }
  }, [user, navigate]);

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    setError(null);

    try {
      if (!user) throw new Error('You must be logged in to place an order.');

      const orderPayload = {
        user_id: user.id,
        total_amount: cart.totalPrice,
        status: 'pending',
        shipping_address_json: { placeholder: true },
        billing_address_json: { placeholder: true },
      };

      const { data, error: insertErr } = await supabase.from('orders').insert(orderPayload).select().single();

      if (insertErr) {
        throw insertErr;
      }

      // Create order_items
      const items = cart.items.map((it) => ({
        order_id: data.id,
        product_id: it.productId,
        product_name: it.name,
        sku: it.sku,
        quantity: it.quantity,
        unit_price: it.price,
        variant_attributes_json: it.variant ?? {},
      }));

      const { error: itemsErr } = await supabase.from('order_items').insert(items);

      if (itemsErr) {
        throw itemsErr;
      }

      // For a real integration, we'd call an Edge Function to create a Stripe Payment Intent here.
      cart.clear();
      navigate(`/order-success/${data.id}`);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <PageLayout.Header>
        <h1 className="text-2xl font-semibold">Checkout</h1>
      </PageLayout.Header>

      <PageLayout.Content>
        {cart.items.length === 0 ? (
          <Card className="p-6">
            <div>Your cart is empty.</div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="font-medium mb-4">Shipping</h3>
              <div className="text-sm text-muted-foreground mb-2">Shipping address placeholder for demo. In production, collect full address info.</div>

              <h3 className="font-medium mt-4 mb-2">Payment</h3>
              <div className="text-sm text-muted-foreground mb-4">Stripe integration is expected to be handled server-side via Supabase Edge Functions. This demo creates an order record and completes checkout flow without processing payment.</div>

              {error && <div className="text-red-600 mb-2">{error}</div>}

              <div className="flex items-center gap-2">
                <Button onClick={handlePlaceOrder} disabled={submitting}>
                  {submitting ? 'Placing order...' : 'Place order'}
                </Button>
                <Button variant="ghost" onClick={() => navigate('/cart')}>
                  Back to cart
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-medium mb-2">Order summary</h3>
              <ul className="space-y-2">
                {cart.items.map((it) => (
                  <li key={it.productId} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{it.name}</div>
                      <div className="text-xs text-muted-foreground">Qty: {it.quantity}</div>
                    </div>
                    <div>${(it.price * it.quantity).toFixed(2)}</div>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-lg font-medium">${cart.totalPrice.toFixed(2)}</div>
              </div>
            </Card>
          </div>
        )}
      </PageLayout.Content>
    </PageLayout>
  );
}
