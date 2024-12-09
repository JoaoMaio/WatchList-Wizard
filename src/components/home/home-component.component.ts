import { Component, OnInit } from '@angular/core';
import { SimpleObject, EmptySimpleObject } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { SuggestionComponent } from "./suggestion-component/suggestion.component";
import {ApiMoviesService} from '../../services/api-movies.service';
import {ApiShowsService} from '../../services/api-shows.service';
import { MatIconModule } from '@angular/material/icon';
import { LoadingContainerComponent } from "../loading-container/loading-container.component";

@Component({
  selector: 'app-home-component',
  standalone: true,
  imports: [CommonModule, SuggestionComponent, MatIconModule, LoadingContainerComponent],
  templateUrl: './home-component.component.html',
  styleUrls: ['./home-component.component.scss']
})
export class HomeComponentComponent implements OnInit {

  isLoading: boolean = true;
  suggestedMovies: SimpleObject[] = [];
  suggestedShows: SimpleObject[] = [];
  topRatedMovies: SimpleObject[] = [];
  topRatedShows: SimpleObject[] = [];
  lastWatchedMovie: SimpleObject = EmptySimpleObject;
  maxSuggestions: number = 20;


  constructor(private movies_api: ApiMoviesService,
              private shows_api: ApiShowsService,
              ) { }

  ngOnInit(): void {
    localStorage.removeItem('searchTerm');
    localStorage.removeItem('selectedFilter');

    this.isLoading = true;

      Promise.all([
        this.getPopularMovies(),
        this.getPopularShows(),
        this.getTopRatedMovies(),
        this.getTopRatedShows()
      ]).then(() => {
        this.isLoading = false;
      }).catch((error) => {
        console.error('Error fetching data:', error);
        this.isLoading = false;
      });
}

  getTrendingMovies(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.movies_api.getTrendingMovies().subscribe({
        next: (response: SimpleObject[]) => {
          // this is only called when the popular movies less than 20
          // i want to fill the rest of the suggestions with trending movies
          this.suggestedMovies = this.suggestedMovies.concat(response);
          this.suggestedMovies = this.suggestedMovies.slice(0, this.maxSuggestions);
          resolve();
        },
        error: (error) => {
          console.error('Error fetching movies:', error);
          reject(error);
        }
      });
    });
  }

  getTrendingTvShows(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.shows_api.getTrendingTvShows().subscribe({
        next: (response: SimpleObject[]) => {
          // this is only called when the popular shows less than 20
          // i want to fill the rest of the suggestions with trending shows
          this.suggestedShows = this.suggestedShows.concat(response);
          this.suggestedShows = this.suggestedShows.slice(0, this.maxSuggestions);
          resolve();
        },
        error: (error) => {
          console.error('Error fetching tvshows:', error);
          reject(error);
        }
      });
    });
  }

  getPopularMovies(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.movies_api.getMoviesByType('popular').subscribe({
        next: (response: SimpleObject[]) => {
          this.suggestedMovies = response;

          if (this.suggestedMovies.length === 0 || this.suggestedMovies.length < this.maxSuggestions) {
            this.getTrendingMovies().then(resolve).catch(reject);
          } else {
            resolve();
          }
        },
        error: (error) => {
          console.error('Error fetching movies:', error);
          reject(error);
        }
      });
    });
  }

  getPopularShows(): Promise<void>{
    return new Promise((resolve, reject) => {
      this.shows_api.getTvShowsByType('popular').subscribe({
        next: (response: SimpleObject[]) => {
          this.suggestedShows = response;

          if (this.suggestedShows.length === 0 || this.suggestedShows.length  < this.maxSuggestions ) {
            this.getTrendingTvShows();
          }

          resolve();
        },
        error: (error) => {
          console.error('Error fetching tvshows:', error);
          reject(error);
        }
      });
    });
  }

  

  getTopRatedMovies(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.movies_api.getTopRatedMovies().subscribe({
        next: (response: SimpleObject[]) => {
          this.topRatedMovies = response;
          resolve();
        },
        error: (error) => {
          console.error('Error fetching movies:', error);
          reject(error);
        }
      });
    });
  }

  getTopRatedShows(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.shows_api.getTopRatedTvShows().subscribe({
        next: (response: SimpleObject[]) => {
          this.topRatedShows = response;
          resolve();
        },
        error: (error) => {
          console.error('Error fetching tvshows:', error);
          reject(error);
        },
      });
    });
  }
}
