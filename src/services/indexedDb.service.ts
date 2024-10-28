import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase } from 'idb';

@Injectable({
  providedIn: 'root',
})
export class IndexedDBService {
  public db?: IDBPDatabase;
  public dbPromise: Promise<IDBPDatabase> | null = null; // Store the initialization promise

  constructor() {
    this.initDB(); // Initialize the DB on construction
  }

  private async initDB() {
    this.dbPromise = openDB('ApiCacheDB', 1, {
      upgrade(db) {
        db.createObjectStore('cache', { keyPath: 'url' });
      },
    });
    this.db = await this.dbPromise; // Wait for the DB to be initialized
  }

  private async getDB(): Promise<IDBPDatabase> {
    if (!this.dbPromise) {
      await this.initDB();
    }
    return this.dbPromise!;
  }

  async get(url: string) {
    const db = await this.getDB();
    return await db.get('cache', url);
  }

  async put(url: string, response: any) {
    const db = await this.getDB();
    await db.put('cache', { url, response });
  }

  async delete(url: string) {
    const db = await this.getDB();
    await db.delete('cache', url);
  }

  async clear() {
    const db = await this.getDB();
    await db.clear('cache');
  }
}
