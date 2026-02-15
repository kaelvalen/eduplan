// Electron API type declarations
interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getAppPath: () => Promise<string>;
  getDatabasePath: () => Promise<string>;
  platform: NodeJS.Platform;
  isElectron: boolean;
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
