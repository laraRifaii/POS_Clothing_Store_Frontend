# POS System: Desktop Frontend

A desktop point-of-sale application for a clothing store, built with **Electron** and a **React + TypeScript (Vite)** renderer. It talks to a separate NestJS backend over REST.

> Backend repository: https://github.com/laraRifaii/POS_Clothing_Store_Backend

## Features

- Desktop app for Windows, macOS and Linux (Electron), with a React UI
- License-key verification handled in the Electron main process
- Encrypted local session storage (`electron-store`)
- PDF receipts and reports (`jsPDF` + `jspdf-autotable`)
- Thermal receipt printing (80 mm) and printer discovery
- Cash drawer trigger through the receipt printer
- Barcode scanner support (scanners act as keyboard input)
- On-screen keyboard shortcut on Windows (touch-screen terminals)
- Form handling and validation with Formik + Yup

## Tech stack

| Layer | Technology |
| --- | --- |
| Desktop shell | Electron 39, electron-builder, electron-store |
| UI | React 19, TypeScript, Vite 7, Tailwind CSS 4, React Router 7 |
| Forms / validation | Formik, Yup |
| HTTP | Axios |
| Documents | jsPDF, jspdf-autotable |
| Icons / toasts | lucide-react, react-toastify |

## Architecture

```
┌──────────────────────────┐   IPC (contextBridge)   ┌─────────────────────┐
│ Renderer (app/)          │ ──────────────────────► │ Main process        │
│ React + Vite             │ ◄────────────────────── │ main.js             │
│ window.electron.*        │                         │ store, license,     │
└────────────┬─────────────┘                         │ printing, drawer    │
             │ REST (Axios)                          └─────────────────────┘
             ▼
      NestJS backend (separate repo)
```

The renderer runs with `contextIsolation: true` and `nodeIntegration: false`. It can only reach native features through the API that `preload.js` exposes as `window.electron`:

| API | Purpose |
| --- | --- |
| `store.get / set / delete` | Encrypted key-value storage |
| `license.verify(key)` | Validates a license key and returns expiry info |
| `print.pdf(base64)` | Opens the print dialog for a PDF |
| `print.thermal(text)` | Silent print to a thermal receipt printer |
| `print.getPrinters()` | Lists installed printers |
| `cashDrawer.open()` | Sends the drawer-open command via the printer |
| `keyboard.show()` | Opens the Windows on-screen keyboard |
| `system.getPlatform()` | Returns the OS platform |

## Project structure

```
.
├── app/              # React + TypeScript renderer (Vite)
├── main.js           # Electron main process
├── preload.js        # Secure bridge exposed as window.electron
├── package.json      # Electron scripts and build tooling
├── renderer/         # Generated: copy of app/dist used in production builds
└── release/          # Generated: installers from electron-builder
```

## Getting started

### Prerequisites

- Node.js 20.19+ (22 LTS recommended) and npm
- The backend running locally or reachable over the network

### Install

```bash
npm install
npm install --prefix app
```

### Environment

Copy the example file and fill in your values:

```bash
cp app/.env.example app/.env
```

<!-- TODO: list the variables the app reads, e.g. the API base URL -->

> Variables prefixed with `VITE_` are bundled into the app and are visible to anyone who has it. Never put secrets in them.

### Run in development

```bash
npm run dev
```

This starts the Vite dev server on `http://localhost:5173`, waits for it, then launches Electron pointed at it. DevTools open automatically.

### Build an installer

```bash
npm run build
```

This cleans old output, builds the React app, copies it to `renderer/`, and runs electron-builder. Installers are written to `release/`.

## Scripts

| Command | Where | What it does |
| --- | --- | --- |
| `npm run dev` | root | Vite + Electron together |
| `npm start` | root | Launch Electron against the built `renderer/` |
| `npm run build` | root | Full production build and installer |
| `npm run clean` | root | Remove `release/` and `renderer/` |
| `npm run dev` | `app/` | Vite dev server only (runs in a browser) |
| `npm run build` | `app/` | Build the React app to `app/dist` |

## Licensing

The app requires a license key on first use. Keys are verified in the Electron main process and carry an ID, a customer name and an expiry date.

## Author

Lara Rifaii
