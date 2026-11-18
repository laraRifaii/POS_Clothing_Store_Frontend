const { app, BrowserWindow, ipcMain } = require('electron');
const Store = require('electron-store');
const path = require('path');
const crypto = require('crypto');

// License configuration - MUST match license-generator.js
const SECRET_KEY = '7RET-WVWH-423Y-1SVY-NJHV-BLBM-LPSY-EWFW';

const ALGORITHM = 'aes-256-cbc';

const store = new Store({
  name: 'pos-session',
  encryptionKey:
    '5fe8f014371b71c863a34e3ab9423936d2bac8941069d0a0f91fd1326f53a352',
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: false,
    kiosk: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: false,
      enableRemoteModule: false,
      sandbox: false,
      backgroundThrottling: false,
      enableBlinkFeatures: 'PointerEvent',
    },
  });

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Production - load from renderer folder
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  }
  // Barcode scanner support (works automatically as keyboard input)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Let barcode scanner input reach React app naturally
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ===============================
// App Lifecycle
// ===============================

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ===============================
// On-Screen Keyboard
// ===============================

ipcMain.handle('show-keyboard', async () => {
  if (process.platform === 'win32') {
    require('child_process').exec('osk.exe');
  }
  return { success: true };
});

// ===============================
// License Verification
// ===============================

ipcMain.handle('license:verify', (_event, formattedKey) => {
  try {
    if (!formattedKey) {
      return {
        isValid: false,
        isExpired: true,
        error: 'No license key provided',
      };
    }

    const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
    const cleanKey = formattedKey.replace(/-/g, '').replace(/\s/g, '');

    if (cleanKey.length < 32) {
      return {
        isValid: false,
        isExpired: true,
        error: 'License key too short',
      };
    }

    if (cleanKey.length % 2 !== 0) {
      return {
        isValid: false,
        isExpired: true,
        error: `Invalid key format: length must be even (got ${cleanKey.length})`,
      };
    }

    const ivHex = cleanKey.substring(0, 32);
    const encrypted = cleanKey.substring(32);

    if (encrypted.length % 2 !== 0) {
      return {
        isValid: false,
        isExpired: true,
        error: 'Invalid encrypted data format',
      };
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const licenseData = JSON.parse(decrypted);

    if (!licenseData.id || !licenseData.exp || !licenseData.name) {
      return {
        isValid: false,
        isExpired: true,
        error: 'Invalid license data structure',
      };
    }

    const now = Date.now();
    const isExpired = now > licenseData.exp;
    const daysRemaining = Math.ceil(
      (licenseData.exp - now) / (1000 * 60 * 60 * 24),
    );

    return {
      isValid: true,
      isExpired: isExpired,
      data: licenseData,
      expiryDate: new Date(licenseData.exp).toISOString(),
      daysRemaining: daysRemaining,
    };
  } catch (error) {
    console.error('License verification error:', error);
    return {
      isValid: false,
      isExpired: true,
      error: error.message || 'Invalid license key',
    };
  }
});

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
// Print Handlers
// ===============================

ipcMain.handle('print-pdf', async (_event, pdfData) => {
  return new Promise((resolve) => {
    try {
      if (!pdfData || typeof pdfData !== 'string') {
        resolve({ success: false, error: 'Invalid PDF data' });
        return;
      }

      const printWindow = new BrowserWindow({
        show: false,
        parent: mainWindow,
        modal: false,
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
    @page { margin: 0; }
    body { margin: 0; }
  </style>
</head>
<body>
  <embed 
    src="data:application/pdf;base64,${pdfData}" 
    type="application/pdf" 
    width="100%" 
    height="100%" 
  />
</body>
</html>`;

      printWindow
        .loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
        .then(() => {
          setTimeout(() => {
            printWindow.webContents.print(
              {
                silent: false,
                printBackground: true,
                deviceName: '',
              },
              (success, errorType) => {
                printWindow.close();
                resolve({ success, error: errorType });
              },
            );
          }, 1000);
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

// ===============================
// Thermal Printer Handler
// ===============================

ipcMain.handle('print-thermal', async (_event, receiptText) => {
  return new Promise((resolve) => {
    try {
      const printWindow = new BrowserWindow({
        show: false,
        parent: null,
        modal: false,
        width: 302,
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
    @page {
      margin: 0;
      size: 80mm auto;
    }
    
    body {
      font-family: 'Courier New', 'Courier', monospace;
      font-size: 12px;
      line-height: 1.4;
      margin: 0;
      padding: 2mm 2mm 5mm 2mm;
      width: 80mm;
      color: #000;
      background: #fff;
    }
    
    pre {
      margin: 0;
      padding: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: inherit;
      font-size: inherit;
    }
    
    * {
      color: #000 !important;
      background: #fff !important;
    }
  </style>
</head>
<body>
  <pre>${receiptText}</pre>
</body>
</html>`;

      printWindow
        .loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
        .then(() => {
          setTimeout(() => {
            printWindow.webContents.print(
              {
                silent: true,
                printBackground: true,
                color: false,
                margins: {
                  marginType: 'none',
                },
              },
              (success, errorType) => {
                printWindow.close();

                if (success) {
                  resolve({ success: true });
                } else {
                  console.error('❌ Print failed:', errorType);
                  resolve({ success: false, error: errorType });
                }
              },
            );
          }, 800);
        })
        .catch((error) => {
          printWindow.close();
          console.error('❌ Print window load error:', error);
          resolve({ success: false, error: String(error) });
        });
    } catch (error) {
      console.error('❌ Print error:', error);
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

// ===============================
// Cash Drawer Handler
// ===============================

ipcMain.handle('open-cash-drawer', async () => {
  try {
    const result = await openCashDrawerViaPrinter();

    if (result.success) {
    } else {
      console.error('❌ Cash drawer failed:', result.error);
    }

    return result;
  } catch (error) {
    console.error('Cash drawer error:', error);
    return { success: false, error: String(error) };
  }
});

async function openCashDrawerViaPrinter() {
  return new Promise((resolve) => {
    try {
      const drawerWindow = new BrowserWindow({
        show: false,
        width: 1,
        height: 1,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
        },
      });

      // ESC/POS command to open cash drawer
      const escPos = String.fromCharCode(0x1b, 0x70, 0x00, 0x19, 0xfa);

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; font-family: monospace; }
  </style>
</head>
<body><pre>${escPos}</pre></body>
</html>`;

      drawerWindow
        .loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
        .then(() => {
          setTimeout(() => {
            drawerWindow.webContents.print(
              {
                silent: true,
                printBackground: false,
              },
              (success, errorType) => {
                drawerWindow.close();

                if (success) {
                  resolve({ success: true });
                } else {
                  resolve({ success: false, error: errorType });
                }
              },
            );
          }, 300);
        })
        .catch((error) => {
          drawerWindow.close();
          resolve({ success: false, error: String(error) });
        });
    } catch (error) {
      resolve({ success: false, error: String(error) });
    }
  });
}
