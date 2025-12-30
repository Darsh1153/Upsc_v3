/**
 * AI Mind Map Storage Service
 * Uses IndexedDB for web and AsyncStorage for mobile
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface AIMindMap {
  id: string;
  title: string;
  description: string;
  mermaidCode: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mermaidCode?: string;
  reasoning_details?: any;
  timestamp: string;
}

const DB_NAME = 'UPSCMindMapDB';
const DB_VERSION = 1;
const STORE_NAME = 'mindmaps';
const ASYNC_STORAGE_KEY = '@ai_mindmaps';

// IndexedDB for Web
class IndexedDBStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('title', 'title', { unique: false });
        }
      };
    });
  }

  async getAll(): Promise<AIMindMap[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result || [];
        // Sort by updatedAt descending
        results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        resolve(results);
      };
    });
  }

  async get(id: string): Promise<AIMindMap | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async save(mindMap: AIMindMap): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(mindMap);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(id: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// AsyncStorage for Mobile
class AsyncStorageWrapper {
  async getAll(): Promise<AIMindMap[]> {
    try {
      const data = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
      if (!data) return [];
      const mindMaps = JSON.parse(data) as AIMindMap[];
      // Sort by updatedAt descending
      return mindMaps.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (error) {
      console.error('Failed to get mind maps:', error);
      return [];
    }
  }

  async get(id: string): Promise<AIMindMap | null> {
    const all = await this.getAll();
    return all.find(m => m.id === id) || null;
  }

  async save(mindMap: AIMindMap): Promise<void> {
    try {
      const all = await this.getAll();
      const index = all.findIndex(m => m.id === mindMap.id);
      if (index >= 0) {
        all[index] = mindMap;
      } else {
        all.push(mindMap);
      }
      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(all));
    } catch (error) {
      console.error('Failed to save mind map:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const all = await this.getAll();
      const filtered = all.filter(m => m.id !== id);
      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete mind map:', error);
      throw error;
    }
  }
}

// Export the appropriate storage based on platform
const storage = Platform.OS === 'web' ? new IndexedDBStorage() : new AsyncStorageWrapper();

// Helper to generate UUID
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// API Functions
export const getAllMindMaps = (): Promise<AIMindMap[]> => storage.getAll();
export const getMindMap = (id: string): Promise<AIMindMap | null> => storage.get(id);
export const saveMindMap = (mindMap: AIMindMap): Promise<void> => storage.save(mindMap);
export const deleteMindMap = (id: string): Promise<void> => storage.delete(id);

// Create a new mind map
export const createMindMap = (title: string, description: string = ''): AIMindMap => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title,
    description,
    mermaidCode: '',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
};

// Add a message to a mind map
export const addMessage = (
  mindMap: AIMindMap,
  role: 'user' | 'assistant',
  content: string,
  mermaidCode?: string,
  reasoning_details?: any
): AIMindMap => {
  const message: ChatMessage = {
    id: generateId(),
    role,
    content,
    mermaidCode,
    reasoning_details,
    timestamp: new Date().toISOString(),
  };

  return {
    ...mindMap,
    messages: [...mindMap.messages, message],
    mermaidCode: mermaidCode || mindMap.mermaidCode,
    updatedAt: new Date().toISOString(),
  };
};

