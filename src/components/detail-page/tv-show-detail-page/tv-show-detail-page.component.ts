import { Component } from '@angular/core';
import { ApiService, ComplexTvshow } from '../../../services/api.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tv-show-detail-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tv-show-detail-page.component.html',
  styleUrl: '../movie-detail-page/movie-detail-page.component.scss'
})
export class TvShowDetailPageComponent {

  tvshow: ComplexTvshow | undefined;
  isLoading: boolean = true;
  watchList: boolean = false;

  constructor(private api: ApiService,
    private route: ActivatedRoute,
) { }

  ngOnInit(): void {
    
    this.route.params.subscribe(params => {
      this.isLoading  = true;
      this.api.getTvShowById(params['id']).subscribe({
        next: (response: ComplexTvshow) => {
          this.tvshow = response;
        },
        complete: () => {
         this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching movies:', error);
      }});
    });
  }

  addToWatchList() {
    const alreadyMarked = this.watchList;
    this.watchList = !this.watchList;

    if (alreadyMarked) 
    {
      //TODO - remove json from the watchlist json file
      //TODO - add a toast message to confirm the removal
      return;
    }
    else 
    {
      //TODO - add the tv show to the watchlist json 
    }


  }


}
