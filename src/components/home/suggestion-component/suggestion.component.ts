import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { SimpleObject } from '../../../services/api.service';
import {CommonModule} from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../environment';


@Component({
  selector: 'app-suggestion-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './suggestion.component.html',
  styleUrls: ['./suggestion.component.scss']
})
export class SuggestionComponent implements OnInit, OnChanges {

  @Input() suggestions: SimpleObject[] = [];

  visibleSuggestions: SimpleObject[] = [];

  imgPath: string = "https://image.tmdb.org/t/p/w342/";

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

  showInfo(object: SimpleObject) {
    this.router.navigate([`/info/${object.type}`, object.id]);
  }

}
