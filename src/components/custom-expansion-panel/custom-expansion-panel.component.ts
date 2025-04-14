import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {
  ApiService,
  EmptyEpisode,
  EmptySeason,
  EmptyTvShow
} from '../../services/api.service';
import {MatIconModule} from '@angular/material/icon'
import {CommonModule} from '@angular/common';
import {ConfirmModalComponent} from "../confirm-modal/confirm-modal.component";
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {environment} from '../../environment';
import {ApiShowsService, ComplexTvshow, Episode, Season} from '../../services/api-shows.service';
import { DatabaseService, EmptyDatabaseObject, SimpleDatabaseObject } from '../../services/sqlite.service';


@Component({
  selector: 'app-custom-expansion-panel',
  standalone: true,
  imports: [MatIconModule, CommonModule, ConfirmModalComponent, MatProgressBarModule],
  templateUrl: './custom-expansion-panel.component.html',
  styleUrl: './custom-expansion-panel.component.scss',
  animations: [
    trigger('expandCollapse', [
      state('void', style({ height: '0', opacity: 0 })),
      state('*', style({ height: '*', opacity: 1 })),
      transition('void <=> *', [
        animate('300ms ease-in-out')
      ])
    ])
  ]
})
export class CustomExpansionPanelComponent implements OnInit {

  @Input() title: string = '';
  @Input() season: Season = EmptySeason ;
  @Input() isLastSeason: boolean = false;
  @Input() tvshow: ComplexTvshow  = EmptyTvShow;
  @Input() isOnWatchList: boolean = false;
  @Output() addOrRemoveEpisode = new EventEmitter();
  @Output() addedShow = new EventEmitter();


  expanded = false;
  showConfirmModal = false;
  showRewatchedOrRemoveEpisodeModal = false;
  showRewatchedOrRemoveSeasonModal= false;
  selectedEpisode: Episode = EmptyEpisode;
  imgPath = environment.imgPath;

  showDb: SimpleDatabaseObject = EmptyDatabaseObject;


  constructor(public shows_api: ApiShowsService,
              public api: ApiService,
              private databaseService: DatabaseService
            ) { }

  ngOnInit(): void {
      if(this.season!.episodes.length > 0)
      {
        const watched = this.season!.episodes.every(episode => episode.watched);

        if(watched)
        {
          this.season!.timesWatched = this.season!.episodes[0].timesWatched;
          this.season!.episodes.forEach(episode => {
            if(episode.timesWatched < this.season!.timesWatched)
            {
              this.season!.timesWatched = episode.timesWatched;
            }
          });
        }
        else
        {
          this.season!.timesWatched = 0;
        }
      }

    this.showDb = {
      id: this.tvshow.id,
      original_title: this.tvshow.name,
      poster_path: this.tvshow.poster_path,
      status: this.shows_api.getShowStatus(this.tvshow.status),
      timesWatched: -2,
      runtime: 0
    };
  }

  async addShowToWatchList() {
    this.isOnWatchList = true;
    this.showDb.timesWatched = 0;
    await this.databaseService.addOrUpdateShow(this.showDb);
    this.addedShow.emit();
  }

  async markShowAsWatched() {
    this.showDb.timesWatched = 1;
    await this.databaseService.addOrUpdateShow(this.showDb);
  }

  getSeasonCountWatchedEpisodes(season: Season) {
    let count = 0;
    season.episodes.forEach(episode => {
      if (episode.watched) count++;
    });
    return count;
  }

  getSeasonWatchedPercentage(season: any): number {
    const watchedEpisodes = this.getSeasonCountWatchedEpisodes(season);
    if (watchedEpisodes === 0) return 0;
    const totalEpisodes = season.episode_count;
    return (watchedEpisodes / totalEpisodes) * 100;
  }

  //--------------------- EPISODE RELATED --------------------------------//

  async markEpisodeAsWatched(episode: Episode) {
    await this.addShowToWatchList();

    //if episode before current episode is not watched pop up a message
    if(episode.episode_number > 1)
    {
      const previousEpisode = this.season!.episodes.find(e => e.episode_number === episode.episode_number - 1);
      if(previousEpisode && !previousEpisode.watched)
      {
        this.openRewatchModal(episode)
        return;
      }
    }

    episode.watched = true;
    episode.timesWatched = episode.timesWatched + 1;
    await this.databaseService.addOrUpdateEpisode(this.tvshow.id, episode.season_number, episode.episode_number, episode.timesWatched, episode.runtime ? episode.runtime : 0);
    this.api.addShowRuntimeToStorage(episode.runtime ? episode.runtime : 0);

    //emit event to parent component
    this.addOrRemoveEpisode.emit();
  }

  markEpisodeAsUnWatched(episode: Episode) {
    this.selectedEpisode = episode
    this.showRewatchedOrRemoveEpisodeModal = true;
  }

  async RewatchedOrRemoveEpisodeModalCancel() {
    this.selectedEpisode!.watched = false;
    this.selectedEpisode!.timesWatched =  0;

    await this.databaseService.deleteEpisode(this.tvshow.id, this.selectedEpisode.season_number, this.selectedEpisode.episode_number);

    this.showDb.timesWatched = 0;
    await this.databaseService.addOrUpdateShow(this.showDb);

    this.api.removeShowRuntimeToStorage(this.selectedEpisode.runtime);
    this.addOrRemoveEpisode.emit();
    this.showRewatchedOrRemoveEpisodeModal = false;
  }

  async RewatchedOrRemoveEpisodeModalConfirm() {
    this.selectedEpisode!.timesWatched += 1;
    await this.databaseService.addOrUpdateEpisode(this.tvshow.id, this.selectedEpisode.season_number, this.selectedEpisode.episode_number, this.selectedEpisode.timesWatched, this.selectedEpisode.runtime ? this.selectedEpisode.runtime : 0);
    this.api.addShowRuntimeToStorage(this.selectedEpisode.runtime);
    this.showRewatchedOrRemoveEpisodeModal = false;
  }

  openRewatchModal(episode: Episode) {
    this.showConfirmModal = true;
    this.selectedEpisode = episode
  }

  async onMarkAllEpisodesBehindAsWatchedConfirm() {
    this.showConfirmModal = false;

    for (const episode of this.season!.episodes)
    {
      if (episode.season_number === this.selectedEpisode?.season_number &&
        episode.episode_number <= this.selectedEpisode?.episode_number &&
        !episode.watched)
      {
        episode.watched = true;
        episode.timesWatched += 1;

        try {
          await this.databaseService.addOrUpdateEpisode(this.tvshow.id, episode.season_number, episode.episode_number, episode.timesWatched, episode.runtime ? episode.runtime : 0);
          this.api.addShowRuntimeToStorage(episode.runtime ? episode.runtime : 0);
        } catch (error) {
          console.error('Error saving episode:', episode, error);
        }
      }
    }

    this.addOrRemoveEpisode.emit();
  }

  onMarkAllEpisodesBehindAsWatchedCancel() {
    this.showConfirmModal = false;
  }

  //--------------------- SEASON RELATED --------------------------------//

  isFullSseasonWatched() {
    if(this.season?.episode_count == 0)
      return false;
    return this.season!.episodes.every(episode => episode.watched);
  }

  async MarkAllSeasonAsWatched(event?: Event) {
    if(event)
      event.stopPropagation();

    if (this.isFullSseasonWatched() || this.isSeasonWatchedExcludingAiring())
    {
      this.season!.timesWatched += 1;

      for (const episode of this.season!.episodes) {
          episode.watched = true;
          episode.timesWatched += 1;
          try {
            await this.databaseService.addOrUpdateEpisode(this.tvshow.id, episode.season_number, episode.episode_number, episode.timesWatched, episode.runtime ? episode.runtime : 0);
            this.api.addShowRuntimeToStorage(episode.runtime ? episode.runtime : 0);

          } catch (error) {
            console.error('Error saving episode:', episode, error);
          }
      }
    } 
    else
    {
        await this.addShowToWatchList();
        this.season!.timesWatched += 1;
    
        for (const episode of this.season!.episodes) {
          if(!episode.watched) // we only want to mark the episodes that are not watched
          {
            episode.watched = true;
            episode.timesWatched += 1;
            try {
              await this.databaseService.addOrUpdateEpisode(this.tvshow.id, episode.season_number, episode.episode_number, episode.timesWatched, episode.runtime ? episode.runtime : 0);
              this.api.addShowRuntimeToStorage(episode.runtime ? episode.runtime : 0);
  
            } catch (error) {
              console.error('Error saving episode:', episode, error);
            }
          }
        }
    }

    this.addOrRemoveEpisode.emit();
  }

  async RewatchedOrRemoveSeasonModalConfirm(event?: Event) {
  if(event)
    event.stopPropagation();

    await this.addShowToWatchList();

    //get the episode with least times watched
    let leastTimesWatched = this.season!.episodes[0].timesWatched;
    this.season!.episodes.forEach(episode => {
      if(episode.timesWatched < leastTimesWatched)
      {
        leastTimesWatched = episode.timesWatched;
      }
    });

    for (const episode of this.season!.episodes) {
        episode.watched = true;

        if(episode.timesWatched <= leastTimesWatched) {
          episode.timesWatched = leastTimesWatched + 1;

          this.season!.timesWatched = episode.timesWatched;
          try {
            await this.databaseService.addOrUpdateEpisode(this.tvshow.id, episode.season_number, episode.episode_number, episode.timesWatched, episode.runtime ? episode.runtime : 0);
            this.api.addShowRuntimeToStorage(episode.runtime ? episode.runtime : 0);
          } catch (error) {
            console.error('Error saving episode:', episode, error);
          }
        }
          
      }

    this.showRewatchedOrRemoveSeasonModal = false;
    this.addOrRemoveEpisode.emit();
  }

  async RewatchedOrRemoveSeasonModalCancel(event?: Event) {
    if(event)
      event.stopPropagation();

    for (const episode of this.season!.episodes) {
          episode.watched = false;
          episode.timesWatched = 0;
          this.season!.timesWatched = 0;
          try {
            await this.databaseService.deleteEpisode(this.tvshow.id, episode.season_number, episode.episode_number);
            this.showDb.timesWatched = 0;
            await this.databaseService.addOrUpdateShow(this.showDb);
            this.api.removeShowRuntimeToStorage(episode.runtime ? episode.runtime : 0);
          } catch (error) {
            console.error('Error deleting episode:', episode, error);
          }
    }

    this.showRewatchedOrRemoveSeasonModal = false;
    this.addOrRemoveEpisode.emit();
  }

  onMarkAllSeasonAsUnWatched(event: Event) {
    event.stopPropagation();
    this.showRewatchedOrRemoveSeasonModal = true;
  }

  isSeasonWatchedExcludingAiring() {
    let episodes = this.season!.episodes.slice();
    episodes = episodes.filter(episode => episode.runtime != null);

    if (episodes.length == 0)
      return true;

    return episodes.every(episode => episode.watched);
  }

}
