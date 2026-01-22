// app/src/types/electron.d.ts
export interface IElectronAPI {
  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<boolean>;
    delete: (key: string) => Promise<boolean>;
  };
  printPDF: (pdfData: string) => Promise<{ success: boolean; error?: string }>;
  printThermal: (
    receiptText: string,
  ) => Promise<{ success: boolean; error?: string }>;
  getPrinters: () => Promise<Electron.PrinterInfo[]>;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}

export {};
