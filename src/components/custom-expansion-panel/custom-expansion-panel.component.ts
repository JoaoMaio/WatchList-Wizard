import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ApiService, ComplexTvshow, Episode, Season } from '../../services/api.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ConfirmModalComponent } from "../confirm-modal/confirm-modal.component";
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { environment } from '../../environment';


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
export class CustomExpansionPanelComponent {

  @Input() title: string = '';
  @Input() season: Season | undefined;
  @Input() tvshow: ComplexTvshow  | undefined;
  @Input() isOnWatchList: boolean = false;
  @Output() addOrRemoveEpisode = new EventEmitter();

  expanded = false;
  isAccordionOpen = false;
  showConfirmModal = false;
  selectedEpisode: Episode | undefined;
  imgPath = environment.imgPath;


  constructor(public api: ApiService) { }

  addShowToWatchList() {
    this.isOnWatchList = true;
    this.api.saveShowsToFile(this.tvshow!);
  }

  markEpisodeAsWatched(episode: Episode) {
    if(!this.isOnWatchList)
      this.addShowToWatchList();

    //if episode before current episode is not watched pop up a message
    if(episode.episode_number > 1)
    {
      const previousEpisode = this.season!.episodes.find(e => e.episode_number === episode.episode_number - 1);
      if(previousEpisode && !previousEpisode.watched)
      {
        this.openModal(episode)
        return;
      }
    }

    episode.watched = true;
    this.api.saveEpisodeToFile(episode, this.tvshow!.id);

    //emit event to parent component
    this.addOrRemoveEpisode.emit();
  }

  markEpisodeAsUnWatched(episode: Episode) {
    episode.watched = false;
    this.api.removeEpisodeFromFile(episode, this.tvshow!.id);
    this.addOrRemoveEpisode.emit();
  }

  isFullSseasonWatched() {
    if(this.season?.episode_count == 0) 
      return false;
    return this.season!.episodes.every(episode => episode.watched);
  }

 async markAllSeasonAsWatched(event: Event) {
  event.stopPropagation();
    for (const episode of this.season!.episodes) 
      {
          episode.watched = true;
          try {
            await this.api.saveEpisodeToFile(episode, this.tvshow!.id);   // Await saving the episode before proceeding to the next one
          } catch (error) {
            console.error('Error saving episode:', episode, error);
          }
        
      }
  }

  async markAllSeasonAsUnWatched(event: Event) {
    event.stopPropagation();
    for (const episode of this.season!.episodes) 
      {
          episode.watched = false;
          try {
            await this.api.removeEpisodeFromFile(episode, this.tvshow!.id);   // Await saving the episode before proceeding to the next one
          } catch (error) {
            console.error('Error deleting episode:', episode, error);
          }
        
      }
  }


  openModal(episode: Episode) {
    this.showConfirmModal = true;
    this.selectedEpisode = episode
  }

  async onConfirm() {
    this.showConfirmModal = false;
    
      for (const episode of this.season!.episodes) 
      {
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

  getDaysUntiItsOut(episode: Episode) {
    const today = new Date();
    const releaseDate = new Date(episode.air_date);
    const timeDiff = releaseDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff;
  }

  onCancel() {
    this.showConfirmModal = false;  
  }

  getCountWatchedEpisodes(season: Season) {
    let count = 0;
    season.episodes.forEach(episode => {
        if (episode.watched) count++;
      });
    return count;
  }

  getWatchedPercentage(season: any): number {
    const watchedEpisodes = this.getCountWatchedEpisodes(season);
    if (watchedEpisodes === 0) return 0;
    const totalEpisodes = season.episode_count;
    return (watchedEpisodes / totalEpisodes) * 100;
  }
  
}