const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    delete: (key) => ipcRenderer.invoke('store:delete', key),
  },
   license: {
    verify: (licenseKey) => ipcRenderer.invoke('license:verify', licenseKey),
  },
  print: {
    pdf: (pdfData) => ipcRenderer.invoke('print-pdf', pdfData),
    thermal: (receiptText) => ipcRenderer.invoke('print-thermal', receiptText),
    getPrinters: () => ipcRenderer.invoke('get-printers'),
  },
  cashDrawer: {
    open: () => ipcRenderer.invoke('open-cash-drawer'), // ✅ Simple IPC call
  },
  system: {
    getPlatform: () => process.platform,
    getVersion: () => ipcRenderer.invoke('get-app-version'),
  },
  
 
});