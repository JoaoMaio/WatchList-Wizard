import { RouterModule, Routes } from '@angular/router';
import { HomeComponentComponent } from '../components/home/home-component.component';
import { MovieDetailPageComponent } from '../components/detail-page/movie-detail-page/movie-detail-page.component';
import { TvShowDetailPageComponent } from '../components/detail-page/tv-show-detail-page/tv-show-detail-page.component';
import { SearchComponent } from '../components/navbar/search/search/search.component';
import { ProfileComponent } from '../components/profile/profile.component';
import { EditBannerComponent } from '../components/edit-banner/edit-banner.component';
import { ShowAllCollectionsComponent } from '../components/collections/show-all-collections/show-all-collections.component';
import { CollectionItemsComponent } from '../components/collections/collection-items/collection-items.component';
import { MovieListComponent } from '../components/profile/movie-list/movie-list.component';
import { ShowListComponent } from '../components/profile/show-list/show-list.component';
import { PersonDetailPageComponent } from '../components/detail-page/person-detail-page/person-detail-page.component';
import { SettingsComponent } from '../components/settings/settings.component';
import { NgModule } from '@angular/core';
import { RandomComponent } from '../components/random/random.component';

export const routes: Routes = [

    { path: '', component: HomeComponentComponent },
    { path: 'info/movie/:id', component: MovieDetailPageComponent },
    { path: 'info/tvshow/:id', component: TvShowDetailPageComponent },
    { path: 'info/person/:id', component: PersonDetailPageComponent },
    { path: 'search', component: SearchComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'edit-banner', component: EditBannerComponent },
    { path: 'collections', component: ShowAllCollectionsComponent },
    { path: 'collection/:id', component: CollectionItemsComponent },
    { path: 'shows', component: ShowListComponent },
    { path: 'movies', component: MovieListComponent },
    { path: 'settings', component: SettingsComponent },
    { path: 'random', component: RandomComponent },
    { path: '**', redirectTo: '' }

];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
  })
  export class AppRoutingModule {}