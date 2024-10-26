import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';


@Injectable({
  providedIn: 'root'
})
export class CacheDateService {
  private LAST_CACHE_RESET_KEY = 'lastCacheResetDate';


  async checkAndClearCache() {
    const today = new Date().toISOString().split('T')[0]; 

    // Get the last cache reset date
    const { value } = await Preferences.get({ key: this.LAST_CACHE_RESET_KEY });

    if (value && value === today) {
      return; // Cache was already reset today, no action needed
    }

    // If it's a new day, clear the cache
    localStorage.clear();
    
    // Save today's date as the new last cache reset date
    await Preferences.set({
      key: this.LAST_CACHE_RESET_KEY,
      value: today,
    });

  }
}
