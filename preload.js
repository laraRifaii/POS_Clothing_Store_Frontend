const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    delete: (key) => ipcRenderer.invoke('store:delete', key),
  },
  print: {
    pdf: (pdfData) => ipcRenderer.invoke('print-pdf', pdfData),
    thermal: (receiptText) => ipcRenderer.invoke('print-thermal', receiptText),
    getPrinters: () => ipcRenderer.invoke('get-printers'),
  },
});