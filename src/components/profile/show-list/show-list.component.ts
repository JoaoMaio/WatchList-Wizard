import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ApiService, SimpleObject } from '../../../services/api.service';
import { Router } from '@angular/router';
import {CommonModule} from '@angular/common';
import { ApiShowsService } from '../../../services/api-shows.service';

@Component({
  selector: 'app-show-list',
  standalone: true,
  imports: [CommonModule],
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

  ngOnInit() {
    this.api.getFromFile(0, 'tv').then((response) => {
      this.allShows.push(...response)
      console.log(this.allShows)
      this.separateShows();
    })
  }

  separateShows() {

    // if (Ended or Canceled) and watched_all_episodes  == WATCHED
    // if (Returning Series) and watched_all_episodes   == UP TO DATE

    // if (Ended or Canceled) and !watched_all_episodes == WATCHING
    // if (Returning Series)  and !watched_all_episodes == WATCHING
  }

  

  goBack(){
    window.history.back();
  }

}
