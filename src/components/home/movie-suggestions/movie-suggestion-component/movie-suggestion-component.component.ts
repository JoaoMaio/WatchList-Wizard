import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ApiService, ComplexMovie, SimpleMovie, SimpleTvshow } from '../../../../services/api.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';


@Component({
  selector: 'app-suggestion-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './movie-suggestion-component.component.html',
  styleUrls: ['./movie-suggestion-component.component.scss']
})
export class MovieSuggestionComponentComponent implements OnInit, OnChanges {

  @Input() suggestions: SimpleMovie[] | SimpleTvshow[] = [];

  visibleSuggestions: SimpleMovie[] | SimpleTvshow[] = [];
  currentIndex: number = 0;

  constructor(private api : ApiService,
              private router: Router
  ) {}

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void 
  {
    if (changes['suggestions']) 
    {
      this.visibleSuggestions = this.suggestions;
    }
  }

  movieInfo(movie: SimpleMovie) {
    this.router.navigate(['/info/movie', movie.id]);
  }

  showInfo(show: SimpleTvshow) {
    this.router.navigate(['/info/tvshow', show.id]);
  }

  isShowingMovies() {
    return this.visibleSuggestions[0].type === 'movie';
  }


}
