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

export async function fetchUsers(): Promise<any[]> {
    try {
        const res = await fetch(`${API_BASE}/sync-users`);
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        const local = localStorage.getItem('cs_users');
        return local ? JSON.parse(local) : [];
    }
}

export async function saveUsers(users: any[]): Promise<void> {
    localStorage.setItem('cs_users', JSON.stringify(users));
    try {
        await fetch(`${API_BASE}/sync-users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(users),
        });
    } catch (e) {}
}

export async function fetchData(key: string): Promise<any[]> {
    try {
        const res = await fetch(`${API_BASE}/data/${key}`);
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        const local = localStorage.getItem(key);
        return local ? JSON.parse(local) : [];
    }
}

export async function saveData(key: string, data: any[]): Promise<void> {
    localStorage.setItem(key, JSON.stringify(data));
    try {
        await fetch(`${API_BASE}/data/${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    } catch (e) {}
}
