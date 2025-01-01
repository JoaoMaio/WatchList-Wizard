import { Component, OnInit } from '@angular/core';
import { ApiService, EmptySimpleObject, GeneralItem, MovieGenre, ShowGenre, SimpleObject } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../environment';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-random',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './random.component.html',
  styleUrl: './random.component.scss'
})
export class RandomComponent implements OnInit {

    allWatchedShows: SimpleObject[] = []
    allWatchedMovies: SimpleObject[] = []

    suggestedObjects: SimpleObject[] = []
    randomObject: SimpleObject = EmptySimpleObject;

    type: string = "tv";
    currentIndex: number = 0;
    isLoading = true;
    genres : number[] = []
    baseGenres: string[] = [];

    imgPath = environment.imgPath;

  constructor(public api: ApiService, 
              private router: Router
            ) { }

  ngOnInit() {
    this.baseGenres = Object.values(ShowGenre);
    this.orderGenres();
    this.genres = [];
  }

  orderGenres() {
    this.baseGenres.sort();
  }

  addToGenres(genre: string) {
    const g = this.type === "tv" ? this.api.getShowGenre(genre) : this.api.getMovieGenre(genre);
    if (this.genres.includes(g)) 
      this.genres = this.genres.filter(gg => gg !== g);
    else 
      this.genres.push(g);
  }

  switchType() {
    this.type = this.type === "tv" ? "movie" : "tv";

    if (this.type === "tv") 
      this.baseGenres = Object.values(ShowGenre);
    else
      this.baseGenres = Object.values(MovieGenre);
 
    this.genres = [];    
    this.orderGenres();
    this.suggestedObjects = [];
  }

  isInSelectedGenres(genre: string) {
    const g = this.type === "tv" ? this.api.getShowGenre(genre) : this.api.getMovieGenre(genre);

    return this.genres.includes(g);
  }

  discoverByGenre() {
    this.isLoading = true;

    const genres = this.genres.join(","); //join all genres with comma

    const requests = [1, 2, 3].map(page => 
      this.api.getByGenreShowOrMovie(genres,this.type, page).toPromise()
    );

    Promise.all(requests).then(responses => {
      let allResults: SimpleObject[] = [];
      responses.forEach(response => {
      if (response) 
        allResults = allResults.concat(response);
      });

      allResults.sort((a, b) => b.popularity - a.popularity);
      this.suggestedObjects = allResults;
      this.isLoading = false;
    }).catch(error => {
      console.error("Error fetching by genre", error);
      this.isLoading = false;
    });

  }

  getNextSuggestion() {
    this.currentIndex = (this.currentIndex + 1) % this.suggestedObjects.length;
  }
  

  showInfo(object: GeneralItem) {
    this.router.navigate([`/info/${object.type}`, object.id]);
  }
  
}
