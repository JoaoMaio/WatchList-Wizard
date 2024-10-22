import { Component, OnInit } from '@angular/core';
import { ApiService, SimpleObject } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { MovieSuggestionComponentComponent } from "./movie-suggestions/movie-suggestion-component/movie-suggestion-component.component";

@Component({
  selector: 'app-home-component',
  standalone: true,
  imports: [CommonModule, MovieSuggestionComponentComponent],
  templateUrl: './home-component.component.html',
  styleUrls: ['./home-component.component.scss']
})
export class HomeComponentComponent implements OnInit {

  isLoading: boolean = true;  
  imageUrl: string = '';  
  suggestedMovies: SimpleObject[] = [];
  suggestedShows: SimpleObject[] = [];

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.isLoading = true;

    this.getTrendingMovies();
    this.getTrendingTvShows();
  }


  getPopularMovies()
  {
    this.api.getMoviesByType('popular').subscribe({
      next: (response: SimpleObject[]) => {
        this.suggestedMovies = response;
      },
      complete: () => {
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching movies:', error);
    }});
  }

  getTrendingMovies()
  {
    this.api.getTrendingMovies().subscribe({
      next: (response: SimpleObject[]) => {
        this.suggestedMovies = response;
      },
      complete: () => {
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching movies:', error);
    }});
  }


  getPopularShows()
  {
    this.api.getTvShowsByType('popular').subscribe({
      next: (response: SimpleObject[]) => {
        this.suggestedShows = response;
      },
      complete: () => {
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching tvshows:', error);
    }});
  }

  getTrendingTvShows()
  {
    this.api.getTrendingTvShows().subscribe({
      next: (response: SimpleObject[]) => {
        this.suggestedShows = response;
      },
      complete: () => {
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching tvshows:', error);
    }});
  }

}
