/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OG_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
