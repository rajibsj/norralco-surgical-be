import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useCart } from '@/hooks/useCart';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function CartPage() {
  const cart = useCart();
  const navigate = useNavigate();

  return (
    <PageLayout>
      <PageLayout.Header>
        <h1 className="text-2xl font-semibold">Your Cart</h1>
      </PageLayout.Header>

      <PageLayout.Content>
        {cart.items.length === 0 ? (
          <Card className="p-6">
            <div className="text-center">
              <p className="mb-4">Your cart is empty.</p>
              <Button onClick={() => navigate('/')}>Continue Shopping</Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {cart.items.map((it) => (
              <Card key={it.productId} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {it.image ? <img src={it.image} alt={it.name} className="w-20 h-20 object-cover rounded" /> : <div className="w-20 h-20 bg-muted rounded" />}
                  <div>
                    <div className="font-medium">{it.name}</div>
                    <div className="text-sm text-muted-foreground">SKU: {it.sku}</div>
                    <div className="text-sm">Price: ${Number(it.price).toFixed(2)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <input
                    aria-label={`Quantity for ${it.name}`}
                    className="w-16 border rounded px-2 py-1"
                    type="number"
                    min={1}
                    value={it.quantity}
                    onChange={(e) => cart.updateQuantity(it.productId, Math.max(1, Number(e.target.value)))}
                  />
                  <div className="font-medium">${(it.price * it.quantity).toFixed(2)}</div>
                  <Button variant="destructive" onClick={() => cart.removeItem(it.productId)}>
                    Remove
                  </Button>
                </div>
              </Card>
            ))}

            <Card className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total items: {cart.totalItems}</div>
                <div className="text-lg font-medium">Total: ${cart.totalPrice.toFixed(2)}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => navigate('/')}>
                  Continue Shopping
                </Button>
                <Button onClick={() => navigate('/checkout')}>Proceed to Checkout</Button>
              </div>
            </Card>
          </div>
        )}
      </PageLayout.Content>
    </PageLayout>
  );
}
