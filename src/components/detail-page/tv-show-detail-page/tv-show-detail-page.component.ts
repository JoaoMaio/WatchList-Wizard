import { Component } from '@angular/core';
import { ApiService, ComplexTvshow, EInfo, Episode, Season } from '../../../services/api.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { ConfirmModalComponent } from "../../confirm-modal/confirm-modal.component";
import { MatProgressBarModule } from '@angular/material/progress-bar';


@Component({
  selector: 'app-tv-show-detail-page',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, ConfirmModalComponent, MatProgressBarModule ],
  templateUrl: './tv-show-detail-page.component.html',
  styleUrl: '../movie-detail-page/movie-detail-page.component.scss'
})
export class TvShowDetailPageComponent {

  tvshow: ComplexTvshow | undefined;
  isLoading: boolean = true;
  isOnWatchList: boolean = false;
  isOverviewExpanded = false;
  isAccordionOpen = false;
  showConfirmModal = false;
  seasons: Season[] = [];
  selectedEpisode: Episode | undefined;

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
        }
      });
  }

  getCountWatchedEpisodes(season: Season) {
    let count = 0;
    season.episodes.forEach(episode => {
        if (episode.watched) count++;
      });
    return count;
  }

  markEpisodeAsWatched(episode: Episode) {
    if(!this.isOnWatchList)
      this.addShowToWatchList();

    //if episode before current episode is not watched pop up a message
    if(episode.episode_number > 1)
    {
      const previousEpisode = this.seasons.find(season => season.season_number === episode.season_number)?.episodes.find(e => e.episode_number === episode.episode_number - 1);
      if(previousEpisode && !previousEpisode.watched)
      {
        this.openModal(episode)
        return;
      }
    }

    episode.watched = true;
    this.api.saveEpisodeToFile(episode, this.tvshow!.id);
  }

  openModal(episode: Episode) {
    this.showConfirmModal = true;
    this.selectedEpisode = episode
  }

   async onConfirm() {
    this.showConfirmModal = false;
    
    //mark all episodes before the selected episode as watched
    for (const season of this.seasons) {
      for (const episode of season.episodes) {
        if (episode.season_number === this.selectedEpisode?.season_number &&
            episode.episode_number <= this.selectedEpisode?.episode_number &&
            !episode.watched) 
          {
            episode.watched = true;

            try {
              await this.api.saveEpisodeToFile(episode, this.tvshow!.id);   // Await saving the episode before proceeding to the next one
            } catch (error) {
              console.error('Error saving episode:', episode, error);
            }
        }
      }
    }
  }

  onCancel() {
    this.showConfirmModal = false;  
  }

  markEpisodeAsUnWatched(episode: Episode) {
    episode.watched = false;
    this.api.removeEpisodeFromFile(episode, this.tvshow!.id);
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

  getDaysUntiItsOut(episode: Episode) {
    const today = new Date();
    const releaseDate = new Date(episode.air_date);
    const timeDiff = releaseDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff;
  }

  getWatchedPercentage(season: any): number {
    const watchedEpisodes = this.getCountWatchedEpisodes(season);
    const totalEpisodes = season.episode_count;
    return (watchedEpisodes / totalEpisodes) * 100;
  }
}
