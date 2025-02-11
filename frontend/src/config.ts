export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  pocketbaseUrl: process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090',
  searchUrl: process.env.NEXT_PUBLIC_SEARCH_URL || 'http://localhost:4100',
  meilisearchUrl: process.env.NEXT_PUBLIC_MEILI_URL || 'http://localhost:7700',
}; 