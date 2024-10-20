import { Component } from '@angular/core';
import { ApiService, ComplexTvshow, EInfo, Episode, Season } from '../../../services/api.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-tv-show-detail-page',
  standalone: true,
  imports: [CommonModule, MatExpansionModule],
  templateUrl: './tv-show-detail-page.component.html',
  styleUrl: '../movie-detail-page/movie-detail-page.component.scss'
})
export class TvShowDetailPageComponent {

  tvshow: ComplexTvshow | undefined;
  isLoading: boolean = true;
  watched: boolean = false;
  isOverviewExpanded = false;
  isAccordionOpen = false;
  seasons: Season[] = [];

  constructor(private api: ApiService,
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
            this.watched = exists;
          });
        },
        complete: () => {
         this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching movies:', error);
      }});
    });
  }

  getSeasons() {
    this.api.getTvShowSeasons(this.tvshow?.id!, 1).subscribe({
      next: (response) => {
        response.episode_count = response.episodes.length;
        this.seasons.push(response);
        this.getEpisodes();
      },
      error: (error) => {
        console.error('Error fetching seasons:', error);
      }
    });
  }

  getEpisodes() {

    this.api.getAllEpisodesFromFile(this.tvshow?.id!).then(response => {
        console.log('Episodes:', response);
        
        if (response) 
        {
          this.seasons.forEach(season => 
          {
            season.episodes.forEach(episode => 
            {
              const watched = response .find((e: EInfo) => e.episodeNumber === episode.episode_number && e.seasonNumber === episode.season_number);
              console.log('Watched:', watched);
              if (watched) {
                episode.watched = true;
              }
            });
          });
        }

      });
  }

  markEpisodeAsWatched(episode: Episode) {
    //TODO - add the episode to the watchlist json
    console.log(`Marking episode ${episode.episode_number} of season ${episode.season_number} as watched`);
    episode.watched = true;
    this.api.saveEpisodeToFile(episode, this.tvshow!.id);
  }

  addShowToWatchList() {
    const alreadyMarked = this.watched;
    this.watched = !this.watched;

    if (alreadyMarked) 
    {
      //TODO - remove json from the watchlist json file
      //TODO - add a toast message to confirm the removal
      return;
    }
    else 
    {
      //TODO - add the tv show to the watchlist json
      console.log('Adding tv show to watchlist:', this.tvshow);
      this.api.saveShowsToFile(this.tvshow!);
    }
  }


}
