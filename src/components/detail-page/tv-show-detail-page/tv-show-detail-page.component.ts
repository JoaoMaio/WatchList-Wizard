import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  ApiService,
  EmptyEpisode,
  EmptyTvShow,
  SimpleCharacter
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
import { CrewListComponent } from "../crew-list/crew-list.component";
import { BaseChartDirective } from 'ng2-charts';
import { scales } from 'chart.js';

type seasonData = {
  data: number[];
  label: string;
}

type seasonLabels = string[];

type chartData = {
  data: seasonData[];
  labels: seasonLabels[];
}


@Component({
  selector: 'app-tv-show-detail-page',
  standalone: true,
  imports: [CommonModule, CustomExpansionPanelComponent, LoadingContainerComponent, MatDialogModule, MatSelectModule, MatFormFieldModule, MatButtonModule, FormsModule, MatIconModule, CrewListComponent, BaseChartDirective],
  templateUrl: './tv-show-detail-page.component.html',
  styleUrl: './tv-show-detail-page.component.scss'
})
export class TvShowDetailPageComponent implements OnInit, OnDestroy {

  tvshow: ComplexTvshow = EmptyTvShow;
  nextEpisode: Episode = EmptyEpisode;
  seasons: Season[] = [];
  crew: SimpleCharacter[] = [];

  isLoading: boolean = true;
  isOnWatchList: boolean = false;
  isOverviewExpanded = false;
  inToSeeLater: boolean = false;
  isTextClamped: boolean = false;

  imgPath = environment.imgPath;
  backdropPath = environment.backdropPath;


  public charts: chartData = {
    data: [],
    labels: []
  };

  public lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allow the chart to adjust height
    scales: {
      x: {
        ticks: {
          color: 'white', // Change the X-axis tick color
        },
        grid: {
          color: 'rgba(198, 194, 194, 0.2)', // Change the X-axis gridline color
        },
      },
      y: {
        ticks: {
          color: 'white', // Change the Y-axis tick color
        },
        grid: {
          color: 'rgba(198, 194, 194, 0.2)', // Change the Y-axis gridline color
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: 'white', // Change the legend text color
        },
      },
    },  
    elements: {
      line: {
        borderColor: '#87edd8', 
        borderWidth: 2, 
        tension: 0.2, 
      },
      point: {
        radius: 4, 
        borderColor: '#87edd8',
      },
    },

  };

  public currentSeasonIndex = 0; // Start with the first season


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
          this.isTextClamped = this.tvshow.overview.length > 200;
          this.getSeasons();
          this.getIfShowIsOnWatchList();
        },
        complete: () => {
          this.api.getCredits(this.tvshow.id, 'tv').subscribe({
            next: (response) => {
              this.crew = response;
            },
            error: (error) => {
              console.error('Error fetching credits:', error);
            }
          });

          // Check if show is in see later collection
          this.collectionsService.collections$.subscribe(collections => {
            collections.forEach(collection => {
              if (collection.name === 'See Later') {
                collection.items.forEach(item => {
                  if (item.id === this.tvshow.id && item.type === 'tvshow')
                    this.inToSeeLater = true;
                });
              }
            });
          });
        },
        error: (error) => {
          console.error('Error fetching movies:', error);
      }});
    });
  }

  getIfShowIsOnWatchList() {
    this.shows_api.isShowMarked(this.tvshow!.id).then(exists => {
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
          this.createChartData();
          
        }
      });
  }

  public previousSeason() {
    if (this.currentSeasonIndex > 0) {
      this.currentSeasonIndex--;
    }
  }
  
  public nextSeason() {
    if (this.currentSeasonIndex < this.charts.data.length - 1) {
      this.currentSeasonIndex++;
    }
  }
  
  createChartData()
  {
    this.seasons.forEach(season => {
      const seasonData = {
        data: season.episodes.map(episode => episode.vote_average),
        label: `Season ${season.season_number} Episodes`
      };
      const seasonLabels = season.episodes.map(episode => `Ep ${episode.episode_number}`);

      this.charts.data.push(seasonData);
      this.charts.labels.push(seasonLabels);
    });

    this.isLoading = false;
  }

  async addShowToWatchListN() {
    this.isOnWatchList = true;
    await this.shows_api.saveShowsToFile(this.tvshow!, -1);
  }

  async addShowToWatchList() {
    this.isOnWatchList = true;
    await this.shows_api.saveShowsToFile(this.tvshow!, 0);
  }

  isLastSeasonAvailable(season: Season): boolean {
    
    if(this.seasons.length === 0)
      return false;

    if(this.seasons[this.seasons.length - 1].season_number === season.season_number)
      return true;

    //if the last season as no episodes
    return this.seasons[this.seasons.length - 1].episodes.length === 0 && this.seasons[this.seasons.length - 1].season_number - 1 === season.season_number;



  }

  async removeShowsFromWatchList() {
    this.isOnWatchList = false;
    await this.api.removeFromFile(this.tvshow!.id, 'tv');
    await this.shows_api.removeAllEpisodesFromFile(this.tvshow!.id);
    this.seasons.forEach(season => {
      season.episodes.forEach(episode => {
        if (episode.watched) {
          episode.watched = false;
          episode.timesWatched = 0;
        }
        season.timesWatched = 0;
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


  isLastEpisodeOfShow(episode: Episode) {
    const season = this.seasons.find(s => s.season_number === episode.season_number);
    const isLastSeason = this.isLastSeasonAvailable(season!);

    if(isLastSeason)
      {
        if(episode.episode_number === season!.episodes.length)
          return true;
  
        //if its not the last episode of the season check if there are any episodes after it
        const nextEpisode = season!.episodes.find(e => e.episode_number === episode.episode_number + 1);
        if(nextEpisode == null || this.shows_api.getDaysUntiItsOut(nextEpisode) > 0)
          return true;
      }
      
      return false;
  }

  async markShowAsWatched() {
    await this.shows_api.saveShowsToFile(this.tvshow!, 1);
  }

  async markEpisodeAsWatched(episode: Episode) {
    await this.addShowToWatchList();

    if(this.isLastEpisodeOfShow(episode))
      await this.markShowAsWatched();

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
      data: { collections$: this.collectionsService.collections$, id: this.tvshow.id, type: 'tvshow' }
    });

    dialogRef.afterClosed().subscribe(async (collectionId: string) => {
      if (collectionId) {
        const GeneralItem: GeneralItem = {
          id: this.tvshow.id,
          type: 'tvshow',
          title: this.tvshow.name,
          poster_path: this.tvshow.poster_path,
        };

        await this.collectionsService.addToCollection(collectionId, GeneralItem);
        await this.shows_api.saveShowsToFile(this.tvshow!, 0);
      }
    });
  }

  async addToSeeLater() {
    this.inToSeeLater = true;

    //transform movie to GeneralItem
    const GI: GeneralItem = {
      id: this.tvshow.id,
      type: 'tvshow',
      title: this.tvshow.name,
      poster_path: this.tvshow.poster_path,
    };

    this.collectionsService.addToSeeLater(GI);
    this.isOnWatchList = true;
    await this.shows_api.saveShowsToFile(this.tvshow!, 0);
  }

  // go to the previous page
  goBack(){
    window.history.back();
  }

}
