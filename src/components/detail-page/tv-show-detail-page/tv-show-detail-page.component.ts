import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService, ComplexTvshow, EInfo, Episode, Season } from '../../../services/api.service';
import { ActivatedRoute } from '@angular/router';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import { CustomExpansionPanelComponent } from "../../custom-expansion-panel/custom-expansion-panel.component";
import { environment } from '../../../environment';


@Component({
  selector: 'app-tv-show-detail-page',
  standalone: true,
  imports: [CommonModule, CustomExpansionPanelComponent, NgOptimizedImage, NgOptimizedImage, NgOptimizedImage, NgOptimizedImage, NgOptimizedImage],
  templateUrl: './tv-show-detail-page.component.html',
  styleUrl: '../movie-detail-page/movie-detail-page.component.scss'
})
export class TvShowDetailPageComponent implements OnInit, OnDestroy {

  tvshow: ComplexTvshow | undefined;
  isLoading: boolean = true;
  isOnWatchList: boolean = false;
  isOverviewExpanded = false;

  nextEpisode: Episode | undefined;
  seasons: Season[] = [];
  imgPath = environment.imgPath;
  backdropPath = environment.backdropPath;

  constructor(public api: ApiService,
              private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.isLoading  = true;
      this.api.getTvShowById(params['id']).subscribe({
        next: (response: ComplexTvshow) => {
          this.tvshow = response;
          this.getSeasons();
          this.checkIfShowIsOnWatchList();
        },
        complete: () => {
        },
        error: (error) => {
          console.error('Error fetching movies:', error);
      }});
    });
  }

  checkIfShowIsOnWatchList() {
    this.api.showExistsById(this.tvshow!.id).then(exists => {
      this.isOnWatchList = exists;
    });
  }

  addedShow() {
    this.isOnWatchList = true;
  }

  async getSeasons() {
    for (let i = 0; i < this.tvshow!.number_of_seasons; i++)
    {
        try {
            const response = await new Promise<any>((resolve, reject) => {
                this.api.getTvShowSeasons(this.tvshow?.id!, i + 1).subscribe({
                    next: (response) => {
                        response.episode_count = response.episodes.length;
                        resolve(response);
                    },
                    error: (error) => {
                        console.error('Error fetching seasons:', error);
                        reject(error);
                    }
                });
            });
            this.seasons.push(response);
        } catch (error) {
            console.error('Error in loading season:', error);
        }
    }

    try {
        this.getEpisodes();
        this.seasons.sort((a, b) => a.season_number - b.season_number);
    } catch (error) {
        console.error('Error processing seasons:', error);
    }
}

  getEpisodes() {
    this.api.getAllEpisodesFromFile(this.tvshow?.id!).then(response => {
        if (response)
        {
          this.seasons.forEach(season => {
            season.episodes.forEach(episode => {
              const watched = response .find((e: EInfo) => e.episodeNumber === episode.episode_number && e.seasonNumber === episode.season_number);
              const timesWatched = watched ? watched.timesWatched : 0;
              if (watched) episode.watched = true;
              episode.timesWatched = timesWatched;
            });
          });
          this.nextEpisode = this.getNextEpisodeToWatch();
          this.isLoading = false;
        }
      });
  }

  addShowToWatchList() {
    this.isOnWatchList = true;
    this.api.saveShowsToFile(this.tvshow!);
  }

  removeShowsFromWatchList()
  {
    this.isOnWatchList = false;
    this.api.removeShowOrMovieFromFile(this.tvshow!.id, 'tv');
    this.api.removeAllEpisodesFromFile(this.tvshow!.id);
    this.seasons.forEach(season => {
      season.episodes.forEach(episode => {
        if (episode.watched) {
          episode.watched = false;
        }
      });
    });

  }

  generateWordCloud(rating: number): string {
    if(rating >= 8)
      return 'Probably a good show'
    if(rating >= 5)
      return 'Be carefull!'
    if (rating >= 0)
      return 'Probably not a good show';

    return 'No rating available';
  }

  getNextEpisodeToWatch(): Episode | undefined {
    for (const season of this.seasons) {
      for (const episode of season.episodes) {
        if (!episode.watched)
          return episode;
      }
    }
    return undefined;
  }

  markEpisodeAsWatched(episode: Episode) {
    if(!this.isOnWatchList)
      this.addShowToWatchList();

    episode.watched = true;
    this.api.saveEpisodeToFile(episode, this.tvshow!.id);

    this.nextEpisode = this.getNextEpisodeToWatch();
  }

  markEpisodeAsUnWatched(episode: Episode) {
    episode.watched = false;
    this.api.removeEpisodeFromFile(episode, this.tvshow!.id);
  }

  getDaysUntiItsOut(episode: Episode) {
    const today = new Date();
    const releaseDate = new Date(episode.air_date);
    const timeDiff = releaseDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff;
  }

  addOrRemoveEpisode(){
    this.nextEpisode = this.getNextEpisodeToWatch();
  }


  ngOnDestroy()
  {
    this.seasons = [];
    this.nextEpisode = undefined;
  }

}
