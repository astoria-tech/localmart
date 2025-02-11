import PocketBase from 'pocketbase';
import { config } from '@/config';

const pb = new PocketBase(config.pocketbaseUrl);

export default pb;