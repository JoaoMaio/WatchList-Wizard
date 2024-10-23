import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ApiService, SimpleObject } from '../../../services/api.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';


@Component({
  selector: 'app-suggestion-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './suggestion.component.html',
  styleUrls: ['./suggestion.component.scss']
})
export class SuggestionComponent implements OnInit, OnChanges {

  @Input() suggestions: SimpleObject[] | SimpleObject[] = [];

  visibleSuggestions: SimpleObject[] | SimpleObject[] = [];
  currentIndex: number = 0;

  constructor(private router: Router) {}

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void 
  {
    if (changes['suggestions']) 
    {
      this.visibleSuggestions = this.suggestions;
    }
  }

  movieInfo(movie: SimpleObject) {
    this.router.navigate(['/info/movie', movie.id]);
  }

  showInfo(show: SimpleObject) {
    this.router.navigate(['/info/tvshow', show.id]);
  }

  isShowingSuggestions() {
    return this.visibleSuggestions[0].type === 'movie';
  }


}
