import { Component } from '@angular/core';
import { ApiService, ComplexTvshow, EInfo, Episode, Season } from '../../../services/api.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CustomExpansionPanelComponent } from "../../custom-expansion-panel/custom-expansion-panel.component";
import { environment } from '../../../environment';


@Component({
  selector: 'app-tv-show-detail-page',
  standalone: true,
  imports: [CommonModule, CustomExpansionPanelComponent],
  templateUrl: './tv-show-detail-page.component.html',
  styleUrl: '../movie-detail-page/movie-detail-page.component.scss'
})
export class TvShowDetailPageComponent {

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
          this.api.showExistsById(this.tvshow.id).then(exists => {
            this.isOnWatchList = exists;
          });

        },
        complete: () => {
        },
        error: (error) => {
          console.error('Error fetching movies:', error);
      }});
    });
  }

  async getSeasons() {
    const seasonPromises = [];

    for (let i = 0; i < this.tvshow!.number_of_seasons; i++) {
        const seasonPromise = new Promise<void>((resolve, reject) => {
            this.api.getTvShowSeasons(this.tvshow?.id!, i + 1).subscribe({
                next: (response) => {
                    response.episode_count = response.episodes.length;
                    this.seasons.push(response);
                    resolve();
                },
                error: (error) => {
                    console.error('Error fetching seasons:', error);
                    reject(error);
                }
            });
        });
        seasonPromises.push(seasonPromise);
    }

    try {
        await Promise.all(seasonPromises);
        this.getEpisodes();
        this.seasons.sort((a, b) => a.season_number - b.season_number);
    } catch (error) {
        console.error('Error fetching seasons:', error);
    }
  }

  getEpisodes() {
    this.api.getAllEpisodesFromFile(this.tvshow?.id!).then(response => {
        if (response) 
        {
          this.seasons.forEach(season => {
            season.episodes.forEach(episode => {
              const watched = response .find((e: EInfo) => e.episodeNumber === episode.episode_number && e.seasonNumber === episode.season_number);
              if (watched) episode.watched = true;
            });
          });
          this.isLoading = false;
          this.nextEpisode = this.getNextEpisodeToWatch();
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

}
