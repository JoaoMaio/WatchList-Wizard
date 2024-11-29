import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { Collection, GeneralItem } from '../utils/collection.model';

@Injectable({
  providedIn: 'root'
})
export class CollectionsService {
  private collectionsSubject = new BehaviorSubject<Collection[]>([]);
  collections$ = this.collectionsSubject.asObservable();
  
  private collections_filename = 'collections.json';

  constructor(private generalApi: ApiService) {
    this.loadCollections();
  }

  private async loadCollections(): Promise<void> {
    try {
      if (!await this.generalApi.checkIfFileExists(this.collections_filename)) {
        return;
      }

      const fileData = await this.generalApi.readFromFile(this.collections_filename);
      if (fileData.data) {
        try {
          const collections = JSON.parse(fileData.data as string);
          this.collectionsSubject.next(collections);
        } catch (error) {
          console.error('Error parsing collections JSON file:', error);
        }
      }
    } catch (e) {
      console.error('Error loading collections:', e);
    }
  }

  private async saveCollections(collections: Collection[]): Promise<void> {
    try {
      const updatedContent = JSON.stringify(collections, null, 2);
      await this.generalApi.writeToFile(this.collections_filename, updatedContent);
      this.collectionsSubject.next(collections);
    } catch (e) {
      console.error('Unable to write collections file:', e);
    }
  }

  async createCollection(name: string): Promise<void> {
    const collections = this.collectionsSubject.value;
    const newCollection: Collection = {
      id: Date.now().toString(),
      name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: []
    };
    
    collections.push(newCollection);
    console.log('collections', collections);
    await this.saveCollections(collections);
  }

  async addToCollection(collectionId: string, item: GeneralItem): Promise<void> {
    const collections = this.collectionsSubject.value;
    const collection = collections.find(c => c.id === collectionId);

    if (collection) {
      collection.items.push(item);
      collection.updated_at = new Date().toISOString();
      await this.saveCollections(collections);
    }
  }

  async removeFromCollection(collectionId: string, itemId: number): Promise<void> {
    const collections = this.collectionsSubject.value;
    const collection = collections.find(c => c.id === collectionId);
    
    if (collection) {
      collection.items = collection.items.filter(item => item.id !== itemId);
      collection.updated_at = new Date().toISOString();
      await this.saveCollections(collections);
    }
  }

  async deleteCollection(collectionId: string): Promise<void> {
    const collections = this.collectionsSubject.value;
    const updatedCollections = collections.filter(c => c.id !== collectionId);
    await this.saveCollections(updatedCollections);
  }
} 