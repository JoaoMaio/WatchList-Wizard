import { Component, ComponentRef, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { DatabaseService, SimpleDatabaseObject, SimpleEpisodeObject } from '../../services/sqlite.service';
import { Preferences } from '@capacitor/preferences';
import { ApiService, SimpleObject } from '../../services/api.service';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { CustomToastrComponent } from '../custom-toastr/custom-toastr.component';
import { LoadingContainerComponent } from "../loading-container/loading-container.component";
import { CommonModule } from '@angular/common';


interface MovieImport{
  imdb_id: string;
  is_watched: boolean;
}


@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [LoadingContainerComponent, CommonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {


    @ViewChild('toastrContainer', { read: ViewContainerRef }) toastrContainer!: ViewContainerRef;
  
    toastrRef!: ComponentRef<CustomToastrComponent>;

    isLoading = false;


    constructor(private databaseService: DatabaseService,
                private generalApi: ApiService) { }

    ngOnInit() {
    }

    async clearAllData() {
      this.isLoading = true;
      await this.databaseService.resetDatabase();
      localStorage.clear();

      // delete all keys from the preferences
      const keys = await Preferences.keys();
      for (const key of keys.keys) {
        await Preferences.remove({ key });
      }
      this.isLoading = false;
      this.showToastr('Deleted everything successfully', 'green');
    }

    async getAllMoviesFromFile() {
      this.isLoading = true;
      var filename = 'movies.json';

      const result = await FilePicker.pickFiles({
        types: ['application/json'],
        limit: 1,
        readData: true,
      });


      // if file name is not equal to the filename, return
      if (result.files[0].name !== filename) {
        this.isLoading = false;
        this.showToastr('Invalid File Selected', 'red');
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

      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      for (const element of movieList) 
      {
        await delay(100); 

        if(element.imdb_id != '-1')
        {
          this.generalApi.findByIMDBId(element.imdb_id).subscribe(async (data) => {
            const movie: SimpleDatabaseObject = data[0];
            movie.timesWatched = element.is_watched ? 1 : 0;    
            movie.runtime = data[1];
            await this.databaseService.addOrUpdateMovie(movie);
            if (element.is_watched) 
              await this.generalApi.addMovieRuntimeToStorage(data[1]);
          });
        }
      }
      this.isLoading = false;
      this.showToastr('Movie import ended successfully', 'green');
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
  
    async importMoviesFromApp()
    {
      this.isLoading = true;
      var filename = 'movies_backup.json';

      const result = await FilePicker.pickFiles({
        types: ['application/json'],
        limit: 1,
        readData: true,
      });


      // if file name is not equal to the filename, return
      if (result.files[0].name !== filename) {
        this.isLoading = false;
        this.showToastr('Invalid File Selected', 'red');
        return;
      }

      const fileBlob = this.dataURItoBlob(result.files[0].data);
      const rawFile = new File([fileBlob as BlobPart], filename, {
          type: 'application/json',
      });

      // Read the file content as text
      const fileContent = await this.readFileAsText(rawFile);
      const parsedData = JSON.parse(fileContent);
      const movieList: SimpleDatabaseObject[] = parsedData;

      for (const element of movieList) {
        this.databaseService.addOrUpdateMovie(element);
        if (element.timesWatched > 0) 
          await this.generalApi.addMovieRuntimeToStorage(element.runtime);
      }

      this.isLoading = false;
      this.showToastr('Movie import ended successfully', 'green');
    }

    async importShowsFromApp()
    {
      this.isLoading = true;
      var filename = 'shows_backup.json';

      const result = await FilePicker.pickFiles({
        types: ['application/json'],
        limit: 1,
        readData: true,
      });


      // if file name is not equal to the filename, return
      if (result.files[0].name !== filename) {
        this.isLoading = false;
        this.showToastr('Invalid File Selected', 'red');
        return;
      }

      const fileBlob = this.dataURItoBlob(result.files[0].data);
      const rawFile = new File([fileBlob as BlobPart], filename, {
          type: 'application/json',
      });

      // Read the file content as text
      const fileContent = await this.readFileAsText(rawFile);
      const parsedData = JSON.parse(fileContent);
      const showList: SimpleDatabaseObject[] = parsedData;


      for (const element of showList) {
        this.databaseService.addOrUpdateShow(element);
      }
      this.isLoading = false;
      this.showToastr('Movie import ended successfully', 'green');

    }

    async importEpisodesFromApp()
    {
      this.isLoading = true;
      var filename = 'episodes_backup.json';

      const result = await FilePicker.pickFiles({
        types: ['application/json'],
        limit: 1,
        readData: true,
      });


      // if file name is not equal to the filename, return
      if (result.files[0].name !== filename) {
        this.isLoading = false;
        this.showToastr('Invalid File Selected', 'red');
        return;
      }

      const fileBlob = this.dataURItoBlob(result.files[0].data);
      const rawFile = new File([fileBlob as BlobPart], filename, {
          type: 'application/json',
      });

      // Read the file content as text
      const fileContent = await this.readFileAsText(rawFile);
      const parsedData = JSON.parse(fileContent);
      const episodesList: SimpleEpisodeObject[] = parsedData;

      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      for (const element of episodesList) {
        await delay(100); 
        this.databaseService.addOrUpdateEpisode(element.show_id, element.season_number, element.episode_number, element.times_watched);
      }

      this.isLoading = false;
      this.showToastr('Movie import ended successfully', 'green');
    }

    async exportEverything() {
      try {
        // Fetch movies from the database
        this.isLoading = true;
        const movies = await this.databaseService.getMovies();
        const moviesJson = JSON.stringify(movies);
        await this.generalApi.writeToFile('movies_backup.json', moviesJson);

        const shows = await this.databaseService.getShows();
        const showsJson = JSON.stringify(shows);
        await this.generalApi.writeToFile('shows_backup.json', showsJson);

        const episodes = await this.databaseService.getAllEpisodes();
        const episodesJson = JSON.stringify(episodes);
        await this.generalApi.writeToFile('episodes_backup.json', episodesJson);

        this.isLoading = false;
        this.showToastr('Export ended successfully', 'green');

      } catch (error) {
        this.isLoading = false;
        this.showToastr('Error exporting data', 'red');
      }
    }
    
    // Dynamically create the CustomToastrComponent
    showToastr(message: string, bgColor: string) {

      if (this.toastrRef) {
        this.toastrRef.destroy();
      }
  
      this.toastrRef = this.toastrContainer.createComponent(CustomToastrComponent);
      this.toastrRef.instance.message = message;
      this.toastrRef.instance.bgColor = "var(--a_quinaryColor)";

      if(bgColor === 'red')
        this.toastrRef.instance.bgColor = "var(--a_errorColor)";

  
      // Set the toastr to disappear after 4 seconds, but with animation
      setTimeout(() => {
        this.toastrRef.instance.hideToastr();
      }, 4000);
  
      this.toastrRef.instance.animationStateChange.subscribe(() => {
          this.toastrRef.destroy();
      });
    }

}
