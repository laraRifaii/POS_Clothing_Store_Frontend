const { app, BrowserWindow, ipcMain } = require('electron');
const Store = require('electron-store');
const path = require('path');
const crypto = require('crypto'); // ← ADD THIS
const fs = require('fs'); // ← ADD THIS

// License configuration - MUST match license-generator.js
const SECRET_KEY = '7RET-WVWH-423Y-1SVY-NJHV-BLBM-LPSY-EWFW';
const ALGORITHM = 'aes-256-cbc';

// Simple file-based store
// class Store {
//   constructor(options = {}) {
//     this.name = options.name || 'store';
//     const userDataPath = app.getPath('userData');
//     this.path = path.join(userDataPath, `${this.name}.json`);
//     this.data = {};
//     this.load();

//     console.log('Store initialized at:', this.path);
//   }

//   load() {
//     try {
//       if (fs.existsSync(this.path)) {
//         const fileData = fs.readFileSync(this.path, 'utf8');
//         this.data = JSON.parse(fileData);
//         console.log('Store data loaded');
//       }
//     } catch (error) {
//       console.error('Error loading store:', error);
//       this.data = {};
//     }
//   }

//   save() {
//     try {
//       const dir = path.dirname(this.path);
//       if (!fs.existsSync(dir)) {
//         fs.mkdirSync(dir, { recursive: true });
//       }
//       fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2), 'utf8');
//     } catch (error) {
//       console.error('Error saving store:', error);
//     }
//   }

//   get(key) {
//     return this.data[key];
//   }

//   set(key, value) {
//     this.data[key] = value;
//     this.save();
//   }

//   delete(key) {
//     delete this.data[key];
//     this.save();
//   }

//   clear() {
//     this.data = {};
//     this.save();
//   }
// }

const store = new Store({
  name: 'pos-session',
  encryptionKey: 'pos-system-secret-key-2024',
});

let mainWindow;
app.disableHardwareAcceleration();

/**
 * Verify license key using crypto
 */
ipcMain.handle('license:verify', (_event, formattedKey) => {
  try {
    if (!formattedKey) {
      return {
        isValid: false,
        isExpired: true,
        error: 'No license key provided',
      };
    }

    console.log('Verifying license key...');

    // Generate key from secret
    const key = crypto.createHash('sha256').update(SECRET_KEY).digest();

    // Remove dashes and any whitespace
    const cleanKey = formattedKey.replace(/-/g, '').replace(/\s/g, '');

    console.log('Clean key length:', cleanKey.length);
    console.log('Clean key length is even?', cleanKey.length % 2 === 0);

    // Validate key format
    if (cleanKey.length < 32) {
      return {
        isValid: false,
        isExpired: true,
        error: 'License key too short',
      };
    }

    // Check if key length is even (required for hex decoding)
    if (cleanKey.length % 2 !== 0) {
      return {
        isValid: false,
        isExpired: true,
        error: `Invalid key format: length must be even (got ${cleanKey.length})`,
      };
    }

    // Extract IV (first 32 hex chars = 16 bytes)
    const ivHex = cleanKey.substring(0, 32);
    const encrypted = cleanKey.substring(32);

    console.log('IV length:', ivHex.length);
    console.log('Encrypted data length:', encrypted.length);

    if (encrypted.length % 2 !== 0) {
      return {
        isValid: false,
        isExpired: true,
        error: 'Invalid encrypted data format',
      };
    }

    const iv = Buffer.from(ivHex, 'hex');

    // Decrypt
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const licenseData = JSON.parse(decrypted);

    // Validate structure
    if (!licenseData.id || !licenseData.exp || !licenseData.name) {
      return {
        isValid: false,
        isExpired: true,
        error: 'Invalid license data structure',
      };
    }

    // Check expiry
    const now = Date.now();
    const isExpired = now > licenseData.exp;
    const daysRemaining = Math.ceil(
      (licenseData.exp - now) / (1000 * 60 * 60 * 24),
    );

    console.log('✅ License verified successfully');
    console.log('Client:', licenseData.name);
    console.log('Expires:', new Date(licenseData.exp).toLocaleDateString());
    console.log('Days remaining:', daysRemaining);

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
// Create Main Window - CRITICAL SETTINGS
// ===============================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: false, // Set true for kiosk mode
    kiosk: false, // Set true for locked kiosk
    // autoHideMenuBar: true, // Hide menu bar
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

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../app/dist/index.html'));
  }

  // ✅ FIX: Add barcode scanner support AFTER mainWindow is created
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Barcode scanners typically send rapid keystrokes ending with Enter
    // Don't prevent default - let it reach your React app naturally
    // Most scanners work as keyboard input, so they'll work automatically
  });

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

// Save store on quit
app.on('before-quit', () => {
  console.log('Saving store before quit...');
  store.save();
});

// Disable hardware acceleration if causing issues
// app.disableHardwareAcceleration();

ipcMain.handle('show-keyboard', async () => {
  // Windows on-screen keyboard
  if (process.platform === 'win32') {
    require('child_process').exec('osk.exe');
  }
  return { success: true };
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
// Print Handlers - NO FOCUS STEALING
// ===============================

ipcMain.handle('print-pdf', async (_event, pdfData) => {
  return new Promise((resolve) => {
    try {
      // Create completely isolated print window
      const printWindow = new BrowserWindow({
        show: false,
        parent: null,
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

// ===============================
// Thermal Printer Handler - IMPROVED
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
                  console.log('✅ Receipt printed successfully');
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
// Cash Drawer Handler - PROPER IMPLEMENTATION
// ===============================

ipcMain.handle('open-cash-drawer', async () => {
  try {
    const result = await openCashDrawerViaPrinter();

    if (result.success) {
      console.log('✅ Cash drawer opened successfully');
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
