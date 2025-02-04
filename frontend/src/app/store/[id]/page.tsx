import StoreContent from './StoreContent';

export default function StorePage({ params }: { params: { id: string } }) {
  return <StoreContent storeId={params.id} />;
} 