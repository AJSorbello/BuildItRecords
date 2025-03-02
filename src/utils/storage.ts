const getStorageItem = (key: string): string | null => {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
};

const setStorageItem = (key: string, value: string): void => {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.error('Error setting localStorage:', error);
  }
};

const removeStorageItem = (key: string): void => {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

const storage = {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
};

export default storage;
