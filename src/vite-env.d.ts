/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EXCHANGE_RATE_API_URL: string;
  readonly VITE_EXCHANGE_RATE_API_KEY: string;
  readonly VITE_EXCHANGE_RATE_REFRESH_MINUTES: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
