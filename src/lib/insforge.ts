import { createClient } from '@insforge/sdk';

const INSFORGE_URL = import.meta.env.VITE_INSFORGE_URL as string;
const INSFORGE_ANON_KEY = import.meta.env.VITE_INSFORGE_ANON_KEY as string;

if (!INSFORGE_URL || !INSFORGE_ANON_KEY) {
  throw new Error('[InsForge] Missing VITE_INSFORGE_URL or VITE_INSFORGE_ANON_KEY env vars');
}

export const insforge = createClient({
  baseUrl: INSFORGE_URL,
  anonKey: INSFORGE_ANON_KEY,
});

export type InsforgeUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  providers: string[];
  createdAt: string;
  updatedAt: string;
  profile?: {
    name?: string;
    avatar_url?: string;
  };
};
