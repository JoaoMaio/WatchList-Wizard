import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { GeneralItem, SimpleObject } from '../../../services/api.service';
import { environment } from '../../../environment';
import { ShowItemsInGridComponent } from "../../show-items-in-grid/show-items-in-grid.component";
import { MatIconModule } from '@angular/material/icon';
import { DatabaseService } from '../../../services/sqlite.service';

@Component({
  selector: 'app-movie-list',
  standalone: true,
  imports: [ShowItemsInGridComponent, MatIconModule],
  templateUrl: './movie-list.component.html',
  styleUrl: './movie-list.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class MovieListComponent implements OnInit {

  isLoading: boolean = false;
  AllMovies: SimpleObject[] = [];
  WatchedMovies: SimpleObject[] = [];
  UnwatchedMovies: SimpleObject[] = [];
  WatchedMoviesGeneralItem: GeneralItem[] = [];
  UnwatchedMoviesGeneralItem: GeneralItem[] = [];
  watchedPercentage: number = 0;

  imgPath = environment.imgPath;

  constructor(private databaseService: DatabaseService) { }

  async ngOnInit() {
    this.isLoading = true;

    this.databaseService.getMovies().then((response) => {
      response.forEach((movie) => {
        this.AllMovies.push({
          id: movie.id,
          original_title: movie.original_title,
          title: movie.original_title,
          poster_path: movie.poster_path,
          type: "movie",
          popularity: 0,
          timesWatched: movie.timesWatched,
          status: movie.status
        });
      });
      this.separateMovies();
    })
  }

  separateMovies() {
    this.WatchedMovies = this.AllMovies.filter(movie => movie.timesWatched > 0);
    this.UnwatchedMovies = this.AllMovies.filter(movie => movie.timesWatched == 0);
    this.watchedPercentage = Math.round(this.WatchedMovies.length / this.AllMovies.length * 100);
    this.WatchedMoviesGeneralItem = this.WatchedMovies.map(movie => ({id: movie.id, poster_path: movie.poster_path, title: movie.title, type: 'movie'}));
    this.UnwatchedMoviesGeneralItem = this.UnwatchedMovies.map(movie => ({id: movie.id, poster_path: movie.poster_path, title: movie.title, type: 'movie'}));
    this.isLoading = false;
  }

  goBack(){
    window.history.back();
  }

}
