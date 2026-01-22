// ===============================
// electron/main.js - SIMPLIFIED
// ===============================
const { app, BrowserWindow, ipcMain } = require('electron');
const Store = require('electron-store');
const path = require('path');

const store = new Store({
  name: 'pos-session',
  encryptionKey: 'pos-system-secret-key-2024',
});

let mainWindow;

// ===============================
// Create Main Window - CRITICAL SETTINGS
// ===============================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      // These are critical for focus handling
      webviewTag: false,
      enableRemoteModule: false,
      sandbox: false, // Important: false
      backgroundThrottling: false, // Prevent throttling
    },
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' }); // Detached to avoid focus issues
  } else {
    mainWindow.loadFile(path.join(__dirname, '../app/index.html'));
  }

  // Prevent ANY focus stealing
  mainWindow.on('blur', () => {
    // Don't do anything that might steal focus
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ===============================
// App Lifecycle
// ===============================
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Disable hardware acceleration if causing issues
// app.disableHardwareAcceleration();

// ===============================
// Store Handlers
// ===============================
ipcMain.handle('store:get', async (_event, key) => {
  try {
    return store.get(key);
  } catch (error) {
    console.error('Store get error:', error);
    return null;
  }
});

ipcMain.handle('store:set', async (_event, key, value) => {
  try {
    store.set(key, value);
    return true;
  } catch (error) {
    console.error('Store set error:', error);
    return false;
  }
});

ipcMain.handle('store:delete', async (_event, key) => {
  try {
    store.delete(key);
    return true;
  } catch (error) {
    console.error('Store delete error:', error);
    return false;
  }
});

// ===============================
// Print Handlers - NO FOCUS STEALING
// ===============================

ipcMain.handle('print-pdf', async (_event, pdfData) => {
  return new Promise((resolve) => {
    try {
      // Create completely isolated print window
      const printWindow = new BrowserWindow({
        show: false,
        parent: null, // No parent to avoid focus issues
        modal: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
        },
      });

      printWindow
        .loadURL(`data:application/pdf;base64,${pdfData}`)
        .then(() => {
          // Small delay to ensure load
          setTimeout(() => {
            printWindow.webContents.print(
              { silent: false, printBackground: true },
              (success, errorType) => {
                printWindow.close();
                resolve({ success, error: errorType });
              },
            );
          }, 500);
        })
        .catch((error) => {
          printWindow.close();
          resolve({ success: false, error: String(error) });
        });
    } catch (error) {
      resolve({ success: false, error: String(error) });
    }
  });
});

ipcMain.handle('print-thermal', async (_event, receiptText) => {
  return new Promise((resolve) => {
    try {
      const printWindow = new BrowserWindow({
        show: false,
        parent: null,
        modal: false,
        width: 400,
        height: 600,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
        },
      });

      const html = `<!DOCTYPE html>
                      <html>
                      <head>
                        <meta charset="UTF-8">
                        <style>
                          body { font-family: 'Courier New', monospace; font-size: 12px; margin: 10px; }
                          pre { margin: 0; white-space: pre-wrap; }
                        </style>
                      </head>
                      <body><pre>${receiptText}</pre></body>
                      </html>`;

      printWindow
        .loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
        .then(() => {
          setTimeout(() => {
            printWindow.webContents.print(
              {
                silent: true,
                margins: { marginType: 'none' },
                pageSize: { width: 80000, height: 297000 },
              },
              (success, errorType) => {
                printWindow.close();
                resolve({ success, error: errorType });
              },
            );
          }, 500);
        })
        .catch((error) => {
          printWindow.close();
          resolve({ success: false, error: String(error) });
        });
    } catch (error) {
      resolve({ success: false, error: String(error) });
    }
  });
});

ipcMain.handle('get-printers', async () => {
  if (!mainWindow) return [];
  try {
    return await mainWindow.webContents.getPrinters();
  } catch (error) {
    console.error('Get printers error:', error);
    return [];
  }
});
// Add barcode scanner support
mainWindow.webContents.on('before-input-event', (event, input) => {
  // Barcode scanners typically send rapid keystrokes ending with Enter
  // Don't prevent default - let it reach your React app naturally
  // Most scanners work as keyboard input, so they'll work automatically
});