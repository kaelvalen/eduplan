/**
 * Electron environment utilities
 */

/**
 * Check if the app is running in Electron
 */
export function isElectron(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.electronAPI?.isElectron;
}

/**
 * Get Electron API safely
 */
export function getElectronAPI() {
  if (typeof window === 'undefined') return null;
  return window.electronAPI ?? null;
}

/**
 * Get app version (Electron only)
 */
export async function getAppVersion(): Promise<string | null> {
  const api = getElectronAPI();
  if (!api) return null;
  return api.getAppVersion();
}

/**
 * Get app data path (Electron only)
 */
export async function getAppPath(): Promise<string | null> {
  const api = getElectronAPI();
  if (!api) return null;
  return api.getAppPath();
}

/**
 * Get database path (Electron only)
 */
export async function getDatabasePath(): Promise<string | null> {
  const api = getElectronAPI();
  if (!api) return null;
  return api.getDatabasePath();
}

/**
 * Get platform info
 */
export function getPlatform(): NodeJS.Platform | null {
  const api = getElectronAPI();
  if (!api) return null;
  return api.platform;
}

/**
 * Get version info
 */
export function getVersions() {
  const api = getElectronAPI();
  if (!api) return null;
  return api.versions;
}
