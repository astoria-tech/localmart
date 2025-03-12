'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/auth';
import { formatCurrency } from '@/utils/currency';
import { MapPinIcon, BuildingStorefrontIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import type { LatLngTuple } from 'leaflet';
import styles from './map.module.css';
import { ordersApi, Order } from '@/api';

// We'll create a reference to store Leaflet when it's loaded
let L: any;
let ReactDOMServerModule: any;

// Define interfaces for the store and delivery address
interface StoreWithCoordinates {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
}

interface DeliveryAddress {
  street_address: string[];
  city: string;
  state: string;
  zip_code: string;
  country?: string;
  customer_name?: string;
  customer_phone?: string;
  latitude?: number;
  longitude?: number;
}

// Dynamically import the map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

// Mock coordinates for demo (we'll replace these with real geocoding later)
const MOCK_COORDINATES: { store: LatLngTuple; delivery: LatLngTuple } = {
  store: [40.7594, -73.9229],
  delivery: [40.7614, -73.9265]
};

// Custom marker icon components
const StoreMarker = () => (
  <div className={styles.marker}>
    <BuildingStorefrontIcon />
  </div>
);

const DeliveryMarker = () => (
  <div className={styles.marker}>
    <MapPinIcon />
  </div>
);

const formatDateTime = (isoString: string) => {
  const utcDate = new Date(isoString + 'Z');
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(utcDate);
};

export default function OrderViewPage() {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  // Create a ref for the map instance
  const [mapReady, setMapReady] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [coordinates, setCoordinates] = useState<{ store: LatLngTuple; delivery: LatLngTuple }>({
    store: MOCK_COORDINATES.store,
    delivery: MOCK_COORDINATES.delivery
  });

  useEffect(() => {
    const fetchOrder = async () => {
      if (!user?.token || !orderId) return;

      try {
        const orders = await ordersApi.getUserOrders(user.token);
        const order = orders.find((o: Order) => o.id === orderId);
        
        if (!order) {
          throw new Error('Order not found');
        }

        setOrder(order);

        // Get store coordinates
        if (order.stores && order.stores.length > 0) {
          const store = order.stores[0].store as StoreWithCoordinates;
          
          // Get store coordinates directly from the order data
          const storeLat = store.latitude;
          const storeLng = store.longitude;
          
          // Get delivery coordinates from order
          const deliveryAddress = order.delivery_address as DeliveryAddress | undefined;
          const deliveryLat = deliveryAddress?.latitude;
          const deliveryLng = deliveryAddress?.longitude;
          
          // Check if we have valid coordinates
          const hasStoreCoords = storeLat !== undefined && storeLng !== undefined;
          const hasDeliveryCoords = deliveryLat !== undefined && deliveryLng !== undefined;
          
          if (hasStoreCoords && hasDeliveryCoords) {
            const storeCoords: LatLngTuple = [Number(storeLat), Number(storeLng)];
            const deliveryCoords: LatLngTuple = [Number(deliveryLat), Number(deliveryLng)];
            
            // Validate that the coordinates are valid numbers
            if (!isNaN(storeCoords[0]) && !isNaN(storeCoords[1]) && 
                !isNaN(deliveryCoords[0]) && !isNaN(deliveryCoords[1])) {
              setCoordinates({
                store: storeCoords,
                delivery: deliveryCoords
              });
            } else {
              setCoordinates(MOCK_COORDINATES);
            }
          } else {
            setCoordinates(MOCK_COORDINATES);
          }
        } else {
          setCoordinates(MOCK_COORDINATES);
        }
      } catch (error) {
        // Error handling
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrder();
    }
  }, [user, orderId]);

  // Load Leaflet dynamically on the client side
  useEffect(() => {
    // Dynamic import of Leaflet and ReactDOMServer
    Promise.all([
      import('leaflet'),
      import('react-dom/server')
    ]).then(([leaflet, reactDOMServer]) => {
      L = leaflet.default;
      ReactDOMServerModule = reactDOMServer.default;
      setLeafletLoaded(true);
    });
  }, []);

  useEffect(() => {
    // This effect ensures Leaflet is only loaded client-side
    setMapReady(true);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'picked_up':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: 'Delivery Pending',
      confirmed: 'Confirmed',
      picked_up: 'Picked Up',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    }
    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'succeeded':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: 'Payment Pending',
      processing: 'Processing Payment',
      succeeded: 'Payment Successful',
      failed: 'Payment Failed',
      refunded: 'Payment Refunded'
    }
    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1)
  }

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-[#F5F2EB] pt-24">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-white/50 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-[600px] bg-white/50 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2EB] pt-16 relative">
      {/* Map Background */}
      <div className="absolute inset-0 pt-16">
        {mapReady && leafletLoaded && (
          <MapContainer
            center={[
              (coordinates.store[0] + coordinates.delivery[0]) / 2,
              (coordinates.store[1] + coordinates.delivery[1]) / 2 - 0.007
            ]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            className={styles.leafletContainer}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>'
            />
            <Marker 
              position={coordinates.store}
              icon={L.divIcon({
                className: 'custom-marker',
                html: ReactDOMServerModule.renderToString(<StoreMarker />)
              })}
            >
              <Popup>
                <div className="font-medium">Store Location</div>
                <div className="text-sm text-[#4A5568]">{order.stores[0]?.store.name}</div>
              </Popup>
            </Marker>
            <Marker 
              position={coordinates.delivery}
              icon={L.divIcon({
                className: 'custom-marker',
                html: ReactDOMServerModule.renderToString(<DeliveryMarker />)
              })}
            >
              <Popup>
                <div className="font-medium">Delivery Location</div>
                {order.delivery_address && (
                  <div className="text-sm text-[#4A5568]">
                    {order.delivery_address.street_address.filter(Boolean).join(', ')}
                  </div>
                )}
              </Popup>
            </Marker>
            <Polyline
              positions={[
                coordinates.store,
                coordinates.delivery
              ]}
              color="#2A9D8F"
              weight={3}
              opacity={0.7}
            />
          </MapContainer>
        )}
      </div>

      {/* Floating Order Panel */}
      <div className="absolute left-8 top-24 w-full max-w-lg z-10">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#4A5568] bg-white/90 rounded-lg hover:bg-white transition-colors shadow-sm"
        >
          <XMarkIcon className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Main Order Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
          {/* Header Section */}
          <div className="bg-[#2A9D8F]/10 px-6 py-5 border-b border-[#2A9D8F]/10">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-[#2D3748]">
                Order #{order.id.slice(-6)}
              </h1>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                  {getPaymentStatusLabel(order.payment_status)}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#4A5568]">
              <ClockIcon className="w-4 h-4" />
              <time dateTime={order.created}>{formatDateTime(order.created)}</time>
            </div>
          </div>

          <div className="divide-y divide-[#2A9D8F]/10">
            {/* Order Items Section */}
            <div className="p-6">
              <h2 className="text-sm font-medium text-[#2D3748] uppercase tracking-wider mb-3">Order Details</h2>
              <div className="space-y-6">
                {order.stores.map((store) => (
                  <div key={store.store.id} className="bg-white/50 rounded-lg border border-[#2A9D8F]/10">
                    <div className="px-4 py-3 border-b border-[#2A9D8F]/10 flex items-center gap-2">
                      <BuildingStorefrontIcon className="w-4 h-4 text-[#2A9D8F]" />
                      <h3 className="font-medium text-[#2D3748]">{store.store.name}</h3>
                    </div>
                    <div className="p-4 space-y-2">
                      {store.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 flex items-center justify-center bg-[#2A9D8F]/10 rounded text-[#2A9D8F] font-medium">
                              {item.quantity}
                            </span>
                            <span className="text-[#2D3748]">{item.name}</span>
                          </div>
                          <span className="text-[#4A5568] font-medium">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address Section */}
            <div className="p-6">
              <h2 className="text-sm font-medium text-[#2D3748] uppercase tracking-wider mb-3">Delivery Address</h2>
              <div className="flex items-start gap-3 p-4 bg-[#2A9D8F]/5 rounded-lg">
                <MapPinIcon className="w-5 h-5 text-[#2A9D8F] flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  {order.delivery_address ? (
                    <>
                      <p className="font-medium text-[#2D3748]">{order.delivery_address.street_address.filter(Boolean).join(', ')}</p>
                      <p className="text-[#4A5568]">{order.delivery_address.city}, {order.delivery_address.state} {order.delivery_address.zip_code}</p>
                    </>
                  ) : (
                    <p className="italic text-[#4A5568]">No address available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Price Breakdown Section */}
            <div className="p-6 bg-[#2A9D8F]/5">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center text-[#4A5568]">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.stores.reduce((acc, store) => 
                    acc + store.items.reduce((itemAcc, item) => itemAcc + (item.price * item.quantity), 0), 0
                  ))}</span>
                </div>
                <div className="flex justify-between items-center text-[#4A5568]">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax_amount || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-[#4A5568]">
                  <span>Delivery Fee</span>
                  <span>{formatCurrency(order.delivery_fee)}</span>
                </div>
                <div className="pt-3 border-t border-[#2A9D8F]/10">
                  <div className="flex justify-between items-center text-lg font-medium text-[#2D3748]">
                    <span>Total</span>
                    <span>{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 