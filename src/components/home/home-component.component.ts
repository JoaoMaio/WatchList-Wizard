import { Component, OnInit } from '@angular/core';
import { ApiService, SimpleObject } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { SuggestionComponent } from "./suggestion-component/suggestion.component";
import {ApiMoviesService} from '../../services/api-movies.service';
import {ApiShowsService} from '../../services/api-shows.service';

@Component({
  selector: 'app-home-component',
  standalone: true,
  imports: [CommonModule, SuggestionComponent],
  templateUrl: './home-component.component.html',
  styleUrls: ['./home-component.component.scss']
})
export class HomeComponentComponent implements OnInit {

  isLoading: boolean = true;
  suggestedMovies: SimpleObject[] = [];
  suggestedShows: SimpleObject[] = [];

  constructor(private movies_api: ApiMoviesService,
              private shows_api: ApiShowsService,
              ) { }

  ngOnInit(): void {
    this.isLoading = true;

      Promise.all([
        this.getTrendingMovies(),
        this.getTrendingTvShows(),
      ]).then(() => {
        this.isLoading = false;
      }).catch((error) => {
        console.error('Error fetching data:', error);
        this.isLoading = false;
      });
}

  getTrendingMovies()
  {
    this.movies_api.getTrendingMovies().subscribe({
      next: (response: SimpleObject[]) => {
        this.suggestedMovies = response;
      },
      error: (error) => {
        console.error('Error fetching movies:', error);
    }});
  }


  getTrendingTvShows()
  {
    this.shows_api.getTrendingTvShows().subscribe({
      next: (response: SimpleObject[]) => {
        this.suggestedShows = response;
      },
      error: (error) => {
        console.error('Error fetching tvshows:', error);
    }});
  }

  // getPopularMovies()
  // {
  //   this.movies_api.getMoviesByType('popular').subscribe({
  //     next: (response: SimpleObject[]) => {
  //       this.suggestedMovies = response;
  //     },
  //     error: (error) => {
  //       console.error('Error fetching movies:', error);
  //   }});
  // }



  // getPopularShows()
  // {
  //   this.shows_api.getTvShowsByType('popular').subscribe({
  //     next: (response: SimpleObject[]) => {
  //       this.suggestedShows = response;
  //     },
  //     error: (error) => {
  //       console.error('Error fetching tvshows:', error);
  //   }});
  // }
}
