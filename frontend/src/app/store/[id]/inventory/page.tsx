'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/auth';
import { useStoreRoles } from '@/app/hooks/useStoreRoles';
import { toast } from 'react-hot-toast';
import { config } from '@/config';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface StoreItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
}

interface EditItemModalProps {
  item?: StoreItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<StoreItem>) => void;
}

function EditItemModal({ item, isOpen, onClose, onSave }: EditItemModalProps) {
  const [name, setName] = useState(item?.name || '');
  const [price, setPrice] = useState(item?.price?.toString() || '');
  const [description, setDescription] = useState(item?.description || '');

  useEffect(() => {
    if (isOpen) {
      setName(item?.name || '');
      setPrice(item?.price?.toString() || '');
      setDescription(item?.description || '');
    }
  }, [isOpen, item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      price: parseFloat(price),
      description
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-[#2D3748] mb-4">
          {item ? 'Edit Item' : 'Add New Item'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#4A5568]">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-[#2A9D8F]/20 px-3 py-2 focus:border-[#2A9D8F] focus:ring focus:ring-[#2A9D8F]/50"
              required
            />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-[#4A5568]">
              Price
            </label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              step="0.01"
              min="0"
              className="mt-1 block w-full rounded-md border border-[#2A9D8F]/20 px-3 py-2 focus:border-[#2A9D8F] focus:ring focus:ring-[#2A9D8F]/50"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[#4A5568]">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border border-[#2A9D8F]/20 px-3 py-2 focus:border-[#2A9D8F] focus:ring focus:ring-[#2A9D8F]/50"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#4A5568] hover:text-[#2D3748] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#2A9D8F] text-white rounded-md hover:bg-[#40B4A6] transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StoreInventory({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = use(params);
  const { user } = useAuth();
  const { isAdmin, loading: rolesLoading } = useStoreRoles(storeId);
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [store, setStore] = useState<{ name: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StoreItem | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!rolesLoading && user && !isAdmin) {
      router.push(`/store/${storeId}`);
      toast.error("You don't have permission to access this page");
    }
  }, [isAdmin, rolesLoading, router, storeId, user]);

  useEffect(() => {
    const fetchStoreAndItems = async () => {
      try {
        // Fetch store details
        const storeResponse = await fetch(`${config.apiUrl}/api/v0/stores/${storeId}`);
        if (!storeResponse.ok) {
          throw new Error('Failed to fetch store');
        }
        const storeData = await storeResponse.json();
        setStore(storeData);

        // Fetch store items
        const itemsResponse = await fetch(`${config.apiUrl}/api/v0/stores/${storeId}/items`);
        if (!itemsResponse.ok) {
          throw new Error('Failed to fetch store items');
        }
        const itemsData = await itemsResponse.json();
        setItems(itemsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch store data');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchStoreAndItems();
    }
  }, [storeId, isAdmin]);

  const handleAddItem = () => {
    setEditingItem(undefined);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: StoreItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSaveItem = async (itemData: Partial<StoreItem>) => {
    try {
      if (editingItem) {
        // Update existing item
        const response = await fetch(`${config.apiUrl}/api/v0/stores/${storeId}/items/${editingItem.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(itemData)
        });

        if (!response.ok) throw new Error('Failed to update item');

        const updatedItem = await response.json();
        setItems(items.map(item => item.id === editingItem.id ? updatedItem : item));
        toast.success('Item updated successfully');
      } else {
        // Create new item
        const response = await fetch(`${config.apiUrl}/api/v0/stores/${storeId}/items`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(itemData)
        });

        if (!response.ok) throw new Error('Failed to create item');

        const newItem = await response.json();
        setItems([...items, newItem]);
        toast.success('Item created successfully');
      }

      setIsModalOpen(false);
    } catch (error) {
      toast.error('Failed to save item');
      console.error('Error saving item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`${config.apiUrl}/api/v0/stores/${storeId}/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete item');

      setItems(items.filter(item => item.id !== itemId));
      toast.success('Item deleted successfully');
    } catch (error) {
      toast.error('Failed to delete item');
      console.error('Error deleting item:', error);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || rolesLoading) {
    return (
      <main className="min-h-screen bg-[#F5F2EB] pt-24">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-white/50 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-white/50 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#F5F2EB] pt-24">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#2D3748]">Error</h2>
            <p className="mt-2 text-[#4A5568]">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F2EB] pt-24">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              {store && (
                <Link href={`/store/${storeId}`}>
                  <h1 className="text-4xl font-bold text-[#2D3748] mb-2 hover:text-[#2A9D8F] transition-colors">{store.name}</h1>
                </Link>
              )}
              <div className="flex items-center gap-4">
                <p className="text-lg text-[#4A5568]">Inventory Management</p>
                <Link
                  href={`/store/${storeId}/dashboard`}
                  className="text-[#2A9D8F] hover:text-[#40B4A6] transition-colors text-sm"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
            <button
              onClick={handleAddItem}
              className="bg-[#2A9D8F] text-white px-4 py-2 rounded-lg hover:bg-[#40B4A6] transition-colors flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Add Item
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 rounded-lg border border-[#2A9D8F]/20 bg-white focus:ring-2 focus:ring-[#2A9D8F] focus:border-transparent"
          />
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#2D3748]">{item.name}</h3>
                  <p className="text-[#4A5568]">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditItem(item)}
                    className="p-2 text-[#4A5568] hover:text-[#2A9D8F] transition-colors"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 text-[#4A5568] hover:text-red-500 transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {item.description && (
                <p className="text-sm text-[#4A5568]">{item.description}</p>
              )}
            </div>
          ))}
        </div>

        {/* Edit/Add Item Modal */}
        <EditItemModal
          item={editingItem}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveItem}
        />
      </div>
    </main>
  );
} 