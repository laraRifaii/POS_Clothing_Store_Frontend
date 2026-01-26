// app/src/types/electron.d.ts
export interface LicenseData {
  id: string;
  name: string;
  exp: number;
  maxUsers: number;
  iat: number;
  version: string;
}

export interface LicenseStatus {
  isValid: boolean;
  isExpired: boolean;
  data?: LicenseData;
  expiryDate?: string;
  daysRemaining?: number;
  error?: string;
}

export interface ElectronAPI {
  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<boolean>;
    delete: (key: string) => Promise<boolean>;
  };
  print: {
    pdf: (pdfData: string) => Promise<{ success: boolean; error?: string }>;
    thermal: (
      receiptText: string,
    ) => Promise<{ success: boolean; error?: string }>;
    getPrinters: () => Promise<any[]>;
  };
  cashDrawer: {
    open: () => Promise<{ success: boolean; error?: string }>;
  };
  system: {
    getPlatform: () => string;
    getVersion: () => Promise<string>;
  };

  license: {
    verify: (licenseKey: string) => Promise<LicenseStatus>;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
