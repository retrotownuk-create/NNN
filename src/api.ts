export type Order = {
    id: string;
    orderNumber: string;
    buyerName: string;
    date: string;
    status: 'Pending' | 'Processing' | 'Prepared' | 'Dispatched' | 'Archived';
    priority: 'Normal' | 'Urgent';
    dispatcher: string;
    items: any[];
    packedBy?: string;
    pickedItems?: Record<string, boolean>;
    shippedDate?: string;
    restoredFrom?: string;
};

const API_BASE = 'http://localhost:3001/api';

export async function fetchOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/sync-orders`);
    if (!res.ok) throw new Error('Cloud sync unavailable');
    return await res.json();
}

export async function saveOrders(orders: Order[]): Promise<void> {
    // Save locally first for responsiveness
    localStorage.setItem('orders', JSON.stringify(orders));

    try {
        await fetch(`${API_BASE}/sync-orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orders),
        });
    } catch (e) {
        console.error('Sync save failed:', e);
    }
}
