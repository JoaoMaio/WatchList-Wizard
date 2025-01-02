import { Component, OnInit } from '@angular/core';
import { DatabaseService, SimpleDatabaseObject } from '../../services/sqlite.service';
import { Preferences } from '@capacitor/preferences';
import { ApiService, SimpleObject } from '../../services/api.service';
import { FilePicker } from '@capawesome/capacitor-file-picker';


interface MovieImport{
  imdb_id: string;
  is_watched: boolean;
}


@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {

    constructor(private databaseService: DatabaseService,
                private generalApi: ApiService
    ) { }

    ngOnInit() {
      this.getAllMoviesFromFile();
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


    async getAllMoviesFromFile() {
      var filename = 'movies.json';

      const result = await FilePicker.pickFiles({
        types: ['application/json'],
        limit: 1,
        readData: true,
      });


      // if file name is not equal to the filename, return
      if (result.files[0].name !== filename) {
        console.log('Invalid file selected');
        return;
      }

      const fileBlob = this.dataURItoBlob(result.files[0].data);
      const rawFile = new File([fileBlob as BlobPart], filename, {
          type: 'application/json',
      });

      // Read the file content as text
      const fileContent = await this.readFileAsText(rawFile);
      const parsedData = JSON.parse(fileContent);

      const movieList: MovieImport[] = parsedData.map((movie: any) => ({
        imdb_id: movie.id.imdb,
        is_watched: movie.is_watched,
      }));

      console.log('Mapped Movies:', movieList);
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      for (const element of movieList) {
        await delay(100); 
        this.generalApi.findByIMDBId(element.imdb_id).subscribe(async (data) => {
          const movie: SimpleDatabaseObject = data[0];
          movie.timesWatched = element.is_watched ? 1 : 0;    
          await this.databaseService.addOrUpdateMovie(movie);
          if (element.is_watched) 
            await this.generalApi.addMovieRuntimeToStorage(data[1]);
        });
      }

    }

    async readFileAsText(file: File): Promise<string> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
      });
    }

    dataURItoBlob(dataURI: any) {
      const byteString = window.atob(dataURI);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const int8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < byteString.length; i++) {
        int8Array[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([int8Array], { type: 'application/json' });    
      return blob;
  }
  
}
