declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production' | 'test';
      GITHUB_APP_ID: string;
      GITHUB_APP_PRIVATE_KEY_BASE64: string;
      GITHUB_WEBHOOK_SECRET: string;
    }
  }
}

export {};
