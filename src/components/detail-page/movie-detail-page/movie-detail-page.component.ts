import { Component, OnInit } from '@angular/core';
import {ApiService, EmptyMovie} from '../../../services/api.service';
import { ActivatedRoute } from '@angular/router';
import {CommonModule} from '@angular/common';
import { environment } from '../../../environment';
import {ApiMoviesService, ComplexMovie} from '../../../services/api-movies.service';
import {ConfirmModalComponent} from '../../confirm-modal/confirm-modal.component';
import {LoadingContainerComponent} from '../../loading-container/loading-container.component';
import {MatIconModule} from '@angular/material/icon'
import { GeneralItem } from '../../../utils/collection.model';
import { SelectCollectionDialogComponent } from '../../collections/select-collection-dialog/select-collection-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { CollectionsService } from '../../../services/collections.service';


@Component({
  selector: 'app-movie-detail-page',
  standalone: true,
  imports: [CommonModule, ConfirmModalComponent, LoadingContainerComponent, MatIconModule],
  templateUrl: './movie-detail-page.component.html',
  styleUrl: './movie-detail-page.component.scss'
})
export class MovieDetailPageComponent implements OnInit {

  movie: ComplexMovie = EmptyMovie;
  isLoading: boolean = true;
  watched: boolean = false;
  timesWatched: number = 0;
  imgPath = environment.imgPath;
  backdropPath = environment.backdropPath;

  showRewatchedOrRemoveMovieModal: boolean = false;

  constructor(private movies_api: ApiMoviesService,
              public api: ApiService,
              private route: ActivatedRoute,
              private collectionsService: CollectionsService,
              private dialog: MatDialog
  ) { }

  ngOnInit(): void {

    this.route.params.subscribe(params => {
      this.isLoading  = true;
      this.movies_api.getMovieById(params['id']).subscribe({
        next: (response: ComplexMovie) => {
          this.movie = response;
          this.movies_api.movieExistsById(this.movie.id).then(object => {
            if (object.id > 0)
            {
              this.watched = true;
              this.timesWatched = object.timesWatched || 0;
            }
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

  async addMovieToWatchList() {
    this.watched = true;
    this.timesWatched++;
    await this.movies_api.saveMoviesToFile(this.movie!, this.timesWatched);
  }

  removeMovieFromWatchList() {
    this.showRewatchedOrRemoveMovieModal = true;
  }

  async showRewatchedOrRemoveMovieModalConfirm() {
    this.timesWatched++;
    await this.movies_api.saveMoviesToFile(this.movie!, this.timesWatched);
    this.showRewatchedOrRemoveMovieModal = false;
  }

  async showRewatchedOrRemoveMovieModalCancel() {
    this.watched = false;
    await this.api.removeFromFile(this.movie!.id, 'movie');
    this.showRewatchedOrRemoveMovieModal = false;
  }

  generateWordCloud(rating: number): string {
    if(rating >= 8)
      return 'Probably a good movie'
    if(rating >= 5)
      return 'Be carefull!'
    if (rating >= 0)
      return 'Probably not a good movie';

    return 'No rating available';
  }

  addToCollection(): void {
    const dialogRef = this.dialog.open(SelectCollectionDialogComponent, {
      width: '400px',  
      maxHeight: 'auto',
      autoFocus: false,
      backdropClass: 'select-collection-dialog-backdrop',
      data: { collections$: this.collectionsService.collections$, id: this.movie.id, type: 'movie' }
    });

    dialogRef.afterClosed().subscribe((collectionId: string) => {
      if (collectionId) {
        const GeneralItem: GeneralItem = {
          id: this.movie.id,
          type: 'movie',
          title: this.movie.title,
          poster_path: this.movie.poster_path,
        };
        
        this.collectionsService.addToCollection(collectionId, GeneralItem);
      }
    });
  }

  goBack(){
    window.history.back();
  }
}
