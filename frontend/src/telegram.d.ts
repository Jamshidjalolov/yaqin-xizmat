export {};

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
    readonly DEV?: boolean;
    readonly PROD?: boolean;
    readonly MODE?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          start_param?: string;
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
          [key: string]: unknown;
        };
        ready: () => void;
        expand: () => void;
      };
    };
  }
}
