import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  ApiService,
  EmptyEpisode,
  EmptyTvShow
} from '../../../services/api.service';
import {ActivatedRoute} from '@angular/router';
import {CommonModule} from '@angular/common';
import {CustomExpansionPanelComponent} from "../../custom-expansion-panel/custom-expansion-panel.component";
import {environment} from '../../../environment';
import {ApiShowsService, ComplexTvshow, EInfo, Episode, Season} from '../../../services/api-shows.service';
import {LoadingContainerComponent} from '../../loading-container/loading-container.component';
import { CollectionsService } from '../../../services/collections.service';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { SelectCollectionDialogComponent } from '../../collections/select-collection-dialog/select-collection-dialog.component';
import { GeneralItem } from '../../../utils/collection.model';
import {MatIconModule} from '@angular/material/icon'


@Component({
  selector: 'app-tv-show-detail-page',
  standalone: true,
  imports: [CommonModule, CustomExpansionPanelComponent, LoadingContainerComponent,  MatDialogModule, MatSelectModule, MatFormFieldModule, MatButtonModule, FormsModule, MatIconModule],
  templateUrl: './tv-show-detail-page.component.html',
  styleUrl: './tv-show-detail-page.component.scss'
})
export class TvShowDetailPageComponent implements OnInit, OnDestroy {

  tvshow: ComplexTvshow = EmptyTvShow;
  nextEpisode: Episode = EmptyEpisode;
  seasons: Season[] = [];

  isLoading: boolean = true;
  isOnWatchList: boolean = false;
  isOverviewExpanded = false;

  imgPath = environment.imgPath;
  backdropPath = environment.backdropPath;

  constructor(public api: ApiService,
              public shows_api: ApiShowsService,
              private route: ActivatedRoute,
              private collectionsService: CollectionsService,
                private dialog: MatDialog,
    ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.isLoading  = true;
      this.shows_api.getTvShowById(params['id']).subscribe({
        next: (response: ComplexTvshow) => {
          this.tvshow = response;
          this.getSeasons();
          this.getIfShowIsOnWatchList();
        },
        complete: () => {
        },
        error: (error) => {
          console.error('Error fetching movies:', error);
      }});
    });
  }

  getIfShowIsOnWatchList() {
    this.shows_api.showExistsById(this.tvshow!.id).then(exists => {
      this.isOnWatchList = exists;
    });
  }

  async getSeasons() {
    for (let i = 0; i < this.tvshow!.number_of_seasons; i++)
    {
        try {
            const response = await new Promise<any>((resolve, reject) => {
                this.shows_api.getTvShowSeasons(this.tvshow?.id!, i + 1).subscribe({
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
    this.shows_api.getAllEpisodesFromFile(this.tvshow?.id!).then(response => {
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

  async addShowToWatchList() {
    this.isOnWatchList = true;
    await this.shows_api.saveShowsToFile(this.tvshow!);
  }

  async removeShowsFromWatchList() {
    this.isOnWatchList = false;
    await this.api.removeFromFile(this.tvshow!.id, 'tv');
    await this.shows_api.removeAllEpisodesFromFile(this.tvshow!.id);
    this.seasons.forEach(season => {
      season.episodes.forEach(episode => {
        if (episode.watched) {
          episode.watched = false;
        }
      });
    });

  }

  generateOpinion(rating: number): string {
    if(rating >= 8)
      return 'Probably a good show'
    if(rating >= 5)
      return 'Be carefull!'
    if (rating >= 0)
      return 'Probably not a good show';

    return 'No rating available';
  }

  getNextEpisodeToWatch(): Episode {
    for (const season of this.seasons) {
      for (const episode of season.episodes) {
        if (!episode.watched)
          return episode;
      }
    }
    return EmptyEpisode;
  }

  async markEpisodeAsWatched(episode: Episode) {
    if(!this.isOnWatchList)
      await this.addShowToWatchList();

    episode.watched = true;
    episode.timesWatched += 1;
    await this.shows_api.saveEpisodeToFile(episode, this.tvshow!.id);

    this.nextEpisode = this.getNextEpisodeToWatch();
  }

  markEpisodeAsUnWatched(episode: Episode) {
    this.shows_api.removeEpisodeFromFile(episode, this.tvshow!.id).then(() => {
      episode.watched = false;
      this.nextEpisode = this.getNextEpisodeToWatch();
    });
  }

  onAddOrRemoveEpisode(){
    this.nextEpisode = this.getNextEpisodeToWatch();
  }

  onAddedShow(){
    this.isOnWatchList = true;
  }

  ngOnDestroy() {
    this.seasons = [];
    this.nextEpisode = EmptyEpisode;
  }

  addToCollection(): void {
    const dialogRef = this.dialog.open(SelectCollectionDialogComponent, {
      width: '400px',  
      maxHeight: 'auto',
      autoFocus: false,
      backdropClass: 'select-collection-dialog-backdrop',
      data: { collections$: this.collectionsService.collections$, id: this.tvshow.id.toString(), type: 'tv' }
    });

    dialogRef.afterClosed().subscribe((collectionId: string) => {
      if (collectionId) {
        const GeneralItem: GeneralItem = {
          id: this.tvshow.id,
          type: 'tvshow',
          title: this.tvshow.name,
          poster_path: this.tvshow.poster_path,
        };
        
        this.collectionsService.addToCollection(collectionId, GeneralItem);
      }
    });
  }

  // go to the previous page
  goBack(){
    window.history.back();
  }

}
