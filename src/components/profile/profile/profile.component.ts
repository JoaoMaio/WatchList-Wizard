import { Component } from '@angular/core';
import { ApiService, SimpleObject } from '../../../services/api.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SuggestionComponent } from "../../home/suggestion-component/suggestion.component";

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, SuggestionComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {

  constructor(public api: ApiService,
    private router: Router
  ) { }

  someShows: SimpleObject[] = []
  someMovies: SimpleObject[] = []
  isLoading: boolean = false;

  ngOnInit() {

    this.isLoading = true;
    this.api.getAllShowsOrMovies(10, 'tv').then((response) => {
      this.someShows.push(...response)
      this.someShows.reverse()
      this.isLoading = false;
    })

    this.api.getAllShowsOrMovies(10, 'movie').then((response) => {
      this.someMovies.push(...response)
      this.someMovies.reverse()
      this.isLoading = false;
    })
  }

  showInfo(object: SimpleObject) {
    this.router.navigate([`/info/${object.type}`, object.id]);
  }


}
