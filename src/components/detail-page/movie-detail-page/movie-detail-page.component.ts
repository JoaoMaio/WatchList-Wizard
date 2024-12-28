import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import {ApiService, EmptyMovie, SimpleCharacter} from '../../../services/api.service';
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
import { CrewListComponent } from "../crew-list/crew-list.component";
import { DatabaseService, EmptyDatabaseObject, SimpleDatabaseObject } from '../../../services/sqlite.service';


@Component({
  selector: 'app-movie-detail-page',
  standalone: true,
  imports: [CommonModule, ConfirmModalComponent, LoadingContainerComponent, MatIconModule, CrewListComponent],
  templateUrl: './movie-detail-page.component.html',
  styleUrl: './movie-detail-page.component.scss'
})
export class MovieDetailPageComponent implements OnInit {

  movie: ComplexMovie = EmptyMovie;
  crew: SimpleCharacter[] = [];

  timesWatched: number = 0;

  isLoading: boolean = true;
  watched: boolean = false;
  showRewatchedOrRemoveMovieModal: boolean = false;
  inToSeeLater: boolean = false;
  isOverviewExpanded = false;

  imgPath = environment.imgPath;
  backdropPath = environment.backdropPath;

  movieDb: SimpleDatabaseObject = EmptyDatabaseObject;

  constructor(private movies_api: ApiMoviesService,
              public api: ApiService,
              private route: ActivatedRoute,
              private collectionsService: CollectionsService,
              private dialog: MatDialog,
              private databaseService: DatabaseService
  ) { }


  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.isLoading  = true;
      this.movies_api.getMovieById(params['id']).subscribe({
        next: (response: ComplexMovie) => {
          this.movie = response;

          // Check if movie is in watch list
          this.databaseService.getMovieById(this.movie.id).then((movie: SimpleDatabaseObject) => {
            if (movie.id > 0)
              {
                this.watched = !!(movie.timesWatched || 0 > 0);
                this.timesWatched = movie.timesWatched || 0;
              }
          });

          //transform movie to SimpleDatabaseObject
          this.movieDb = {
            id: this.movie.id,
            original_title: this.movie.title,
            poster_path: this.movie.poster_path,
            status: this.movies_api.getMovieStatus(this.movie.status),
            timesWatched: this.timesWatched
          };

          // Check if movie is in see later collection
          this.collectionsService.collections$.subscribe(collections => {
            collections.forEach(collection => {
              if (collection.name === 'See Later') {
                collection.items.forEach(item => {
                  if (item.id === this.movie.id && item.type === 'movie')
                    this.inToSeeLater = true;
                });
              }
            });
          });
        },
        complete: () => {

          this.api.getCredits(this.movie.id, 'movie').subscribe({
            next: (response) => {
              this.crew = response;
            },
            error: (error) => {
              console.error('Error fetching credits:', error);
            },
            complete: () => {
              this.isLoading = false;
            }
          });
        },
        error: (error) => {
          console.error('Error fetching movies:', error);
      }});
    });
  }

  async addMovieToWatchList() {
    this.watched = true;
    this.timesWatched++;
    this.movieDb.timesWatched = this.timesWatched;
    await this.api.addMovieRuntimeToStorage(this.movie.runtime);
    await this.databaseService.addOrUpdateMovie(this.movieDb);
  }

  removeMovieFromWatchList() {
    this.showRewatchedOrRemoveMovieModal = true;
  }

  async showRewatchedOrRemoveMovieModalConfirm() {
    this.timesWatched++;
    this.movieDb.timesWatched = this.timesWatched;
    await this.api.addMovieRuntimeToStorage(this.movie.runtime);
    await this.databaseService.addOrUpdateMovie(this.movieDb);
    this.showRewatchedOrRemoveMovieModal = false;
  }

  async showRewatchedOrRemoveMovieModalCancel() {
    this.watched = false;
    this.api.removeMovieRuntimeToStorage(this.movie.runtime);
    await this.databaseService.deleteMovie(this.movieDb.id)
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

    dialogRef.afterClosed().subscribe(async (collectionId: string) => {
      if (collectionId) {
        const GeneralItem: GeneralItem = {
          id: this.movie.id,
          type: 'movie',
          title: this.movie.title,
          poster_path: this.movie.poster_path,
        };

        await this.collectionsService.addToCollection(collectionId, GeneralItem);
        this.movieDb.timesWatched = 0;
        await this.databaseService.addOrUpdateMovie(this.movieDb);
      }
    });
  }

  async addToSeeLater() {
    this.inToSeeLater = true;

    //transform movie to GeneralItem
    const GI: GeneralItem = {
      id: this.movie.id,
      type: 'movie',
      title: this.movie.title,
      poster_path: this.movie.poster_path,
    };

    this.collectionsService.addToSeeLater(GI);
    this.movieDb.timesWatched = 0;
    await this.databaseService.addOrUpdateMovie(this.movieDb);
  }

  goBack(){
    window.history.back();
  }
}
