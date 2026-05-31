const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = require('electron-is-dev');

let mainWindow;
let backendProcess;

function startBackend() {
  if (isDev) {
    console.log("Running in development mode. Django backend is managed by concurrently script.");
    return;
  }

  // In production, run the bundled backend_server.exe
  const backendPath = path.join(
    process.resourcesPath,
    'app',
    'backend_server',
    'backend_server.exe'
  );

  console.log("Starting production backend from:", backendPath);

  // Launch backend silently in the background
  backendProcess = spawn(backendPath, ['runserver', '127.0.0.1:8000', '--noreload'], {
    cwd: path.dirname(backendPath),
    stdio: 'ignore', // hides the console window popup
    windowsHide: true // prevents command prompt from flashing
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend process:', err);
  });

  backendProcess.on('exit', (code, signal) => {
    console.log(`Backend process exited with code ${code} and signal ${signal}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "EquiManage",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
  });

  // Remove the default menu bar
  mainWindow.removeMenu();

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(process.resourcesPath, 'app', 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
  }

  // Open external links in the default browser instead of Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Request single instance lock
const additionalData = { myKey: 'equimanage' };
const gotTheLock = app.requestSingleInstanceLock(additionalData);

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Focus the existing window if user tries to open a second instance
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    // startBackend();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (backendProcess) {
    console.log("Terminating Django backend process...");
    // backendProcess.kill();
  }
});
