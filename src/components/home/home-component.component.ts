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
  maxSuggestions: number = 20;


  constructor(private movies_api: ApiMoviesService,
              private shows_api: ApiShowsService,
              ) { }

  ngOnInit(): void {
    localStorage.removeItem('searchTerm');
    this.isLoading = true;

      Promise.all([
        this.getPopularMovies(),
        this.getPopularShows(),
      ]).then(() => {
        this.isLoading = false;
      }).catch((error) => {
        console.error('Error fetching data:', error);
        this.isLoading = false;
      });
}

  getTrendingMovies() {
    this.movies_api.getTrendingMovies().subscribe({
      next: (response: SimpleObject[]) => {

        // this is only called when the popular movies less than 20
        // i want to fill the rest of the suggestions with trending movies
        this.suggestedMovies = this.suggestedMovies.concat(response);
        this.suggestedMovies = this.suggestedMovies.slice(0, this.maxSuggestions);
      },
      error: (error) => {
        console.error('Error fetching movies:', error);
    }});
  }

  getTrendingTvShows() {
    this.shows_api.getTrendingTvShows().subscribe({
      next: (response: SimpleObject[]) => {

        // this is only called when the popular shows less than 20
        // i want to fill the rest of the suggestions with trending shows
        this.suggestedShows = this.suggestedShows.concat(response);
        this.suggestedShows = this.suggestedShows.slice(0, this.maxSuggestions);

      },
      error: (error) => {
        console.error('Error fetching tvshows:', error);
    }});
  }

  getPopularMovies() {
    this.movies_api.getMoviesByType('popular').subscribe({
      next: (response: SimpleObject[]) => {
        this.suggestedMovies = response;

        if (this.suggestedMovies.length === 0 || this.suggestedMovies.length  < this.maxSuggestions ) {
          this.getTrendingMovies();
        }

      },
      error: (error) => {
        console.error('Error fetching movies:', error);
    }});
  }

  getPopularShows() {
    this.shows_api.getTvShowsByType('popular').subscribe({
      next: (response: SimpleObject[]) => {
        this.suggestedShows = response;

        if (this.suggestedShows.length === 0 || this.suggestedShows.length  < this.maxSuggestions ) {
          this.getTrendingTvShows();
        }

      },
      error: (error) => {
        console.error('Error fetching tvshows:', error);
    }});
  }
}
