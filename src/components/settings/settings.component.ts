import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../../services/sqlite.service';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {

    constructor(private databaseService: DatabaseService) { }

    ngOnInit() {
    }

    async clearAllData() {
      await this.databaseService.resetDatabase();
      localStorage.clear();

      // delete all keys from the preferences
      const keys = await Preferences.keys();
      for (const key of keys.keys) {
        await Preferences.remove({ key });
      }
    }

}
