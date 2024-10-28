import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService, SimpleObject } from '../../../services/api.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SuggestionComponent } from "../../home/suggestion-component/suggestion.component";
import { environment } from '../../../environment';
import { Preferences } from '@capacitor/preferences';

type Time = {
  title: string,
  months: number,
  days: number,
  hours: number,
  minutes: number
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, SuggestionComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {

  constructor(public api: ApiService,
    private router: Router
  ) { }

  someShows: SimpleObject[] = []
  someMovies: SimpleObject[] = []
  timeList: Time[] = []
  isLoading: boolean = false;
  totalShowRuntime: number = 0;
  totalMovieRuntime: number = 0;
  totalEpisodesWatched: number = 0;
  totalMoviesWatched: number = 0;
  bannerImage = ''; 

  private BANNER_IMAGE = 'bannerImage';

  // await Preferences.set({
  //   key: this.LAST_CACHE_RESET_KEY,
  //   value: today,
  // });
  // const { value } = await Preferences.get({ key: this.LAST_CACHE_RESET_KEY });

  async ngOnInit() {
    this.isLoading = true;
    const { value } =  await Preferences.get({ key: this.BANNER_IMAGE });

    if (value) {
      this.bannerImage = value;
    } else {
      this.bannerImage = environment.bannerDefault;
    }

    // Get the last 10 shows added to watchlist
    this.api.getAllShowsOrMovies(10, 'tv').then((response) => {
      this.someShows.push(...response)
      this.someShows.reverse()
      this.isLoading = false;
    })

    // Get the last 10 movies added to watchlist
    this.api.getAllShowsOrMovies(10, 'movie').then((response) => {
      this.someMovies.push(...response)
      this.someMovies.reverse()
      this.isLoading = false;
    })

    // Get the total time spent watching shows
    const showTimePromise = this.api.getAllShowsOrMovies(0, 'tv').then(async shows => {
      for (const show of shows) {
        this.totalShowRuntime += await this.api.calculateShowRuntime(show.id);
      }
      this.timeList.push(this.transformMinutesToBetterFormat(this.totalShowRuntime, 'Show'));
    });

    // Get the total time spent watching movies
    const movieTimePromise = this.api.getAllShowsOrMovies(0, 'movie').then(movies => {
      for (const movie of movies) {
        this.totalMovieRuntime += movie.runtime ? movie.runtime : 0;
      }
      this.timeList.push(this.transformMinutesToBetterFormat(this.totalMovieRuntime, 'Movie'));
    });

    // Get the total number of episodes watched
    const showCountPromise = this.api.countAllWatchedEpisodes().then((response) => {
      this.totalEpisodesWatched = response;
    });

    // Get the total number of movies
    const movieCountPromise = this.api.getAllMoviesFromFile().then((response) => {
      this.totalMoviesWatched = response.length;
    });

    // Wait for both shows and movies to load
    Promise.all([showTimePromise, movieTimePromise, showCountPromise, movieCountPromise]).then(() => {
      this.isLoading = false;

      var orderedTimeList : Time[] = []

      //find the show time 
      for (var i = 0; i < this.timeList.length; i++) {
        if (this.timeList[i].title == "Show") {
          orderedTimeList.push(this.timeList[i]);
        }
      }

      //find the movie time
      for (var i = 0; i < this.timeList.length; i++) {
        if (this.timeList[i].title == "Movie") {
          orderedTimeList.push(this.timeList[i]);
        }
      }

      this.timeList = orderedTimeList;
    });
  }

  showInfo(object: SimpleObject) {
    this.router.navigate([`/info/${object.type}`, object.id]);
  }

  transformMinutesToBetterFormat(time: number, time_title: string): Time {

    var showTime = time;

    // If the total time is less than 60 minutes, return the time in minutes
    if (showTime < 60)
      return {title:time_title,  months: 0, days: 0, hours: 0, minutes: showTime };
    
    // If the total time is more than 60 minutes, return the time in hours and minutes
    if (showTime >= 60 && showTime < 1440) 
    {
      var hours = Math.floor(showTime / 60);
      var minutes = showTime % 60;
      return { title:time_title, months: 0, days: 0, hours: hours, minutes: minutes };
    }
    
    // If the total time is more than 1440 minutes, return the time in days, hours and minutes
    if (showTime >= 1440) 
    {
      var days = Math.floor(showTime / 1440);
      var hours = Math.floor((showTime % 1440) / 60);
      var minutes = showTime % 60;
      return { title:time_title, months: 0, days: days, hours: hours, minutes: minutes };
    }

    // IF the total time is more than 43200 minutes, return the time in months, days, hours and minutes
    if (showTime >= 43200) 
    {
      var months = Math.floor(showTime / 43200);
      var days = Math.floor((showTime % 43200) / 1440);
      var hours = Math.floor((showTime % 1440) / 60);
      var minutes = showTime % 60;
      return { title:time_title, months: months, days: days, hours: hours, minutes: minutes };
    }

    // if the total time is 0, return 0 minutes
    return { title:time_title, months: 0, days: 0, hours: 0, minutes: 0 };
  }

  ngOnDestroy() {
    this.isLoading = false;
    this.someShows = [];
    this.someMovies = [];
    this.timeList = [];
    this.totalShowRuntime = 0;
    this.totalMovieRuntime = 0;
    this.totalEpisodesWatched = 0;
    this.totalMoviesWatched = 0;
  }

  openModalEditBanner()
  {
    this.router.navigate(['/edit-banner']);
  }
  

}
