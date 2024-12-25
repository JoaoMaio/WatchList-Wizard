import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ApiService, SimpleObject } from '../../../services/api.service';
import { ApiShowsService } from '../../../services/api-shows.service';
import { GeneralItem } from '../../../utils/collection.model';
import { MatIconModule } from '@angular/material/icon';
import { ShowItemsInGridComponent } from '../../show-items-in-grid/show-items-in-grid.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-show-list',
  standalone: true,
  imports: [ShowItemsInGridComponent, MatIconModule, CommonModule],
  templateUrl: './show-list.component.html',
  styleUrl: './show-list.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class ShowListComponent implements OnInit {


  constructor(public api: ApiService,
              private shows_api: ApiShowsService,
  ) { }

  allShows: SimpleObject[] = []
  watchedShows: SimpleObject[] = []
  upToDateShows: SimpleObject[] = []
  watchingShows: SimpleObject[] = []
  haventStartedShows: SimpleObject[] = []

  watchedShowsGeneralItem: GeneralItem[] = []
  upToDateShowsGeneralItem: GeneralItem[] = []
  watchingShowsGeneralItem: GeneralItem[] = []
  haventStartedShowsGeneralItem: GeneralItem[] = []

  watchedPercentage: number = 0;
  upToDatePercentage: number = 0;
  watchingPercentage: number = 0;
  haventStartedPercentage: number = 0;

  isLoading: boolean = false;

  ngOnInit() {
    this.isLoading = true;
    this.api.getFromFile(0, 'tv').then((response) => {
      this.allShows.push(...response)
      this.separateShows();
    })
  }

  separateShows() {

    this.watchedShows = this.allShows.filter(show => show.timesWatched > 0 && (show.status == 3 || show.status == 4));
    this.upToDateShows = this.allShows.filter(show => show.timesWatched > 0 && show.status == 0);
    this.watchingShows = this.allShows.filter(show => show.timesWatched == 0 && (show.status == 0 || show.status == 3 || show.status == 4));
    this.haventStartedShows = this.allShows.filter(show => show.timesWatched == -1);

    this.watchedShowsGeneralItem = this.watchedShows.map(show => ({id: show.id, poster_path: show.poster_path, title: show.title, type: 'tvshow'}));
    this.upToDateShowsGeneralItem = this.upToDateShows.map(show => ({id: show.id, poster_path: show.poster_path, title: show.title, type: 'tvshow'}));
    this.watchingShowsGeneralItem = this.watchingShows.map(show => ({id: show.id, poster_path: show.poster_path, title: show.title, type: 'tvshow'}));
    this.haventStartedShowsGeneralItem = this.haventStartedShows.map(show => ({id: show.id, poster_path: show.poster_path, title: show.title, type: 'tvshow'}));

    this.watchedPercentage = Math.round(this.watchedShows.length / this.allShows.length * 100);
    this.upToDatePercentage = Math.round(this.upToDateShows.length / this.allShows.length * 100);
    this.watchingPercentage = Math.round(this.watchingShows.length / this.allShows.length * 100);
    this.haventStartedPercentage = Math.round(this.haventStartedShows.length / this.allShows.length * 100);

    this.isLoading = false;
  }

  

  goBack(){
    window.history.back();
  }

}
