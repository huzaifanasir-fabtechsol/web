const { contextBridge, shell } = require('electron');

// Expose a safe, limited set of APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  openExternal: (url) => {
    // Only allow HTTP/HTTPS URLs to be opened externally for security
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
  }
});
