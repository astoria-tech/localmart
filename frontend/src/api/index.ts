import { config } from '@/config';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  token: string;
  roles: string[];
}

export interface UserResponse {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    roles: string[];
  };
  token: string;
}

export interface Profile {
  first_name: string;
  last_name: string;
  phone_number: string;
  street_1: string;
  street_2: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
}

export interface Order {
  id: string;
  order_id: string;
  created: string;
  status: string;
  payment_status: string;
  delivery_fee: number;
  total_amount: number;
  tax_amount: number;
  delivery_address?: {
    street_address: string[];
    city: string;
    state: string;
    zip_code: string;
    country?: string;
    customer_name?: string;
    customer_phone?: string;
  };
  customer_phone?: string;
  scheduled_delivery_start?: string;
  scheduled_delivery_end?: string;
  stores: {
    store: {
      id: string;
      name: string;
      latitude?: number;
      longitude?: number;
    };
    items: {
      id: string;
      name: string;
      quantity: number;
      price: number;
    }[];
  }[];
}

export interface Store {
  id: string;
  name: string;
  street_1: string;
  street_2?: string;
  city: string;
  state: string;
  zip_code: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  items?: StoreItem[];
  latitude?: number;
  longitude?: number;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  isDefault: boolean;
}

export interface OrderCreateData {
  token: string;
  user_id: string;
  store_id: string;
  payment_method_id: string;
  items: {
    store_item_id: string;
    quantity: number;
    price: number;
  }[];
  subtotal_amount: number;
  tax_amount: number;
  delivery_fee: number;
  total_amount: number;
  delivery_address: {
    street_address: string[];
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  scheduled_delivery_start?: string;
  scheduled_delivery_end?: string;
  customer_notes?: string;
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API Error: ${response.status}`);
  }
  return response.json();
}

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<UserResponse> => {
    const response = await fetch(`${config.apiUrl}/api/v0/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  signup: async (email: string, password: string, first_name: string, last_name: string): Promise<UserResponse> => {
    const response = await fetch(`${config.apiUrl}/api/v0/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        passwordConfirm: password,
        first_name,
        last_name
      }),
    });
    return handleResponse(response);
  },

  getProfile: async (token: string): Promise<Profile> => {
    const response = await fetch(`${config.apiUrl}/api/v0/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  updateProfile: async (token: string, profile: Partial<Profile>): Promise<Profile> => {
    const response = await fetch(`${config.apiUrl}/api/v0/user/profile`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    });
    return handleResponse(response);
  },
};

// Orders API
export const ordersApi = {
  getUserOrders: async (token: string): Promise<Order[]> => {
    const response = await fetch(`${config.apiUrl}/api/v0/user/orders`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getAdminOrders: async (token: string): Promise<Order[]> => {
    const response = await fetch(`${config.apiUrl}/api/v0/orders`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getOrder: async (token: string, orderId: string): Promise<Order> => {
    const response = await fetch(`${config.apiUrl}/api/v0/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  createOrder: async (token: string, orderData: OrderCreateData): Promise<Order> => {
    const response = await fetch(`${config.apiUrl}/api/v0/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    return handleResponse(response);
  },

  getOrderById: async (token: string, orderId: string): Promise<Order> => {
    const response = await fetch(`${config.apiUrl}/api/v0/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  updateOrderStatus: async (token: string, orderId: string, status: string): Promise<Order> => {
    const response = await fetch(`${config.apiUrl}/api/v0/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },
};

// Stores API
export const storesApi = {
  getAllStores: async (): Promise<Store[]> => {
    const response = await fetch(`${config.apiUrl}/api/v0/stores`);
    return handleResponse(response);
  },

  getAdminStores: async (token: string): Promise<Store[]> => {
    const response = await fetch(`${config.apiUrl}/api/v0/stores`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getStore: async (storeId: string): Promise<Store> => {
    const response = await fetch(`${config.apiUrl}/api/v0/stores/${storeId}`);
    return handleResponse(response);
  },

  getStoreItems: async (storeId: string): Promise<StoreItem[]> => {
    const response = await fetch(`${config.apiUrl}/api/v0/stores/${storeId}/items`);
    return handleResponse(response);
  },

  getStoreOrders: async (token: string, storeId: string): Promise<Order[]> => {
    const response = await fetch(`${config.apiUrl}/api/v0/stores/${storeId}/orders`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getStoreRoles: async (token: string, storeId: string): Promise<{ roles: string[] }> => {
    const response = await fetch(`${config.apiUrl}/api/v0/stores/${storeId}/roles`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  geocodeStoreAddress: async (token: string, storeId: string): Promise<Store> => {
    const response = await fetch(`${config.apiUrl}/api/v0/stores/${storeId}/geocode`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  createStoreItem: async (token: string, storeId: string, itemData: Partial<StoreItem>): Promise<StoreItem> => {
    const response = await fetch(`${config.apiUrl}/api/v0/stores/${storeId}/items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });
    return handleResponse(response);
  },

  updateStoreItem: async (token: string, storeId: string, itemId: string, itemData: Partial<StoreItem>): Promise<StoreItem> => {
    const response = await fetch(`${config.apiUrl}/api/v0/stores/${storeId}/items/${itemId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });
    return handleResponse(response);
  },

  deleteStoreItem: async (token: string, storeId: string, itemId: string): Promise<void> => {
    const response = await fetch(`${config.apiUrl}/api/v0/stores/${storeId}/items/${itemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getStoreWithItems: async (storeId: string): Promise<Store & { items: StoreItem[] }> => {
    const [store, items] = await Promise.all([
      storesApi.getStore(storeId),
      storesApi.getStoreItems(storeId)
    ]);
    return {
      ...store,
      items: items.map(item => ({
        ...item,
        imageUrl: `https://picsum.photos/seed/${item.id}/400/300`
      }))
    };
  },

  getAllStoresWithItems: async (): Promise<(Store & { items: StoreItem[] })[]> => {
    const stores = await storesApi.getAllStores();
    const storesWithItems = await Promise.all(
      stores.map(async (store) => {
        const items = await storesApi.getStoreItems(store.id);
        return {
          ...store,
          items: items.map(item => ({
            ...item,
            imageUrl: `https://picsum.photos/seed/${item.id}/400/300`
          }))
        };
      })
    );
    return storesWithItems;
  },
};

// Payment API
export const paymentApi = {
  getCards: async (token: string): Promise<SavedCard[]> => {
    const response = await fetch(`${config.apiUrl}/api/v0/payment/cards`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (response.status === 404) return [];
    return handleResponse(response);
  },

  createSetupIntent: async (token: string): Promise<{ client_secret: string }> => {
    const response = await fetch(`${config.apiUrl}/api/v0/payment/setup-intent`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  attachCard: async (token: string, paymentMethodId: string): Promise<SavedCard> => {
    const response = await fetch(`${config.apiUrl}/api/v0/payment/cards`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payment_method_id: paymentMethodId }),
    });
    return handleResponse(response);
  },

  deleteCard: async (token: string, cardId: string): Promise<void> => {
    const response = await fetch(`${config.apiUrl}/api/v0/payment/cards/${cardId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },
};

// Search API
export const searchApi = {
  searchProducts: async (query: string): Promise<any[]> => {
    const response = await fetch(
      `${config.searchUrl}/api/search?query=${encodeURIComponent(query)}&index=products`
    );
    const { hits } = await handleResponse<{ hits: any[] }>(response);
    return hits;
  },
}; 