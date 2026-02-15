const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';
const serverPort = process.env.PORT || 3000;

let mainWindow;
let serverModule;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../public/icon.png'),
    title: 'EduPlan',
    show: false,
    autoHideMenuBar: true,
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Load the app
  mainWindow.loadURL(`http://localhost:${serverPort}`);

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function startNextServer() {
  // In development mode, we expect an external Next.js dev server
  if (isDev) {
    console.log('Development mode: expecting external Next.js dev server on port', serverPort);
    return;
  }
  
  // Production mode: start embedded server
  try {
    serverModule = require('./server');
    await serverModule.startServer();
    console.log('Next.js server started');
  } catch (err) {
    console.error('Failed to start Next.js server:', err);
    throw err;
  }
}

async function stopNextServer() {
  if (isDev || !serverModule) return;
  
  try {
    await serverModule.stopServer();
    console.log('Next.js server stopped');
  } catch (err) {
    console.error('Failed to stop server:', err);
  }
}

app.whenReady().then(async () => {
  // Start Next.js server (production only)
  await startNextServer();
  
  // Create main window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    await stopNextServer();
    app.quit();
  }
});

app.on('before-quit', async () => {
  await stopNextServer();
});

// IPC handlers for communication between renderer and main process
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('get-database-path', () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'eduplan.db');
});
