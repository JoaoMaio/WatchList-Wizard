import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ApiMoviesService } from '../../../services/api-movies.service';
import { ApiService, SimpleObject } from '../../../services/api.service';
import { environment } from '../../../environment';
import { ShowItemsInGridComponent } from "../../show-items-in-grid/show-items-in-grid.component";
import { GeneralItem } from '../../../utils/collection.model';
import { MatIconModule } from '@angular/material/icon';

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

  constructor(public movies_api: ApiMoviesService,
              public api: ApiService,
  ) { }

  async ngOnInit() {
    this.isLoading = true;

    //Get all movies
    this.api.getFromFile(0, 'movie').then((response) => {
      this.AllMovies.push(...response)
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

  // go to the previous page
  goBack(){
    window.history.back();
  }

  getBackgroundGradient(): string {
    return `linear-gradient(to right, green ${this.watchedPercentage}%, var(--a_secondaryColor) ${this.watchedPercentage}%)`;
  }
  

}
