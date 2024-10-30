import { Component, OnInit } from '@angular/core';
import { ApiService, SimpleObject } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { SuggestionComponent } from "./suggestion-component/suggestion.component";

@Component({
  selector: 'app-home-component',
  standalone: true,
  imports: [CommonModule, SuggestionComponent],
  templateUrl: './home-component.component.html',
  styleUrls: ['./home-component.component.scss']
})
export class HomeComponentComponent implements OnInit {

  isLoading: boolean = true;  
  imageUrl: string = '';  
  suggestedMovies: SimpleObject[] = [];
  suggestedShows: SimpleObject[] = [];
  UpcomingMovies: SimpleObject[] = [];

  constructor(private api: ApiService) { }

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
    this.api.getTrendingMovies().subscribe({
      next: (response: SimpleObject[]) => {
        this.suggestedMovies = response;
      },
      error: (error) => {
        console.error('Error fetching movies:', error);
    }});
  }


  getTrendingTvShows()
  {
    this.api.getTrendingTvShows().subscribe({
      next: (response: SimpleObject[]) => {
        this.suggestedShows = response;
      },
      error: (error) => {
        console.error('Error fetching tvshows:', error);
    }});
  }

  // getPopularMovies()
  // {
  //   this.api.getMoviesByType('popular').subscribe({
  //     next: (response: SimpleObject[]) => {
  //       this.suggestedMovies = response;
  //     },
  //     error: (error) => {
  //       console.error('Error fetching movies:', error);
  //   }});
  // }

  

  // getPopularShows()
  // {
  //   this.api.getTvShowsByType('popular').subscribe({
  //     next: (response: SimpleObject[]) => {
  //       this.suggestedShows = response;
  //     },
  //     error: (error) => {
  //       console.error('Error fetching tvshows:', error);
  //   }});
  // }



}
