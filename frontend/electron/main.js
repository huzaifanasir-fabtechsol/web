const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

let mainWindow;



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


