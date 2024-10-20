import { Routes } from '@angular/router';
import { HomeComponentComponent } from '../components/home/home-component.component';
import { MovieDetailPageComponent } from '../components/detail-page/movie-detail-page/movie-detail-page.component';
import { TvShowDetailPageComponent } from '../components/detail-page/tv-show-detail-page/tv-show-detail-page.component';

export const routes: Routes = [

    { path: '', component: HomeComponentComponent },
    { path: 'info/movie/:id', component: MovieDetailPageComponent },
    { path: 'info/tvshow/:id', component: TvShowDetailPageComponent },
    // { path: 'list/:type', component: ShowsListComponent },
    // { path: 'detail/:type/:id', component: ShowDetailComponent },
    // { path: 'genres', component: GenresComponent },
    // { path: 'genres/:genreId', component: GenresComponent },
];

