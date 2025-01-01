import {Injectable} from '@angular/core';
import {environment} from '../environment';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {ApiService, Genre, SimpleObject, Spoken_Languages} from './api.service';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';


export type ComplexTvshow = {
  id: number
  backdrop_path: string
  genres: Genre[];
  name: string
  original_language: string
  original_name: string
  overview: string
  popularity: number
  poster_path: string
  release_date: string
  video: boolean
  vote_average: number
  vote_count: number
  episode_run_time: string
  type: string
  in_production: boolean
  languages: string[]
  last_air_date: string
  first_air_date: string
  last_episode_to_air: Episode
  next_episode_to_air: Episode
  number_of_episodes: number
  number_of_seasons: number
  spoken_languages: Spoken_Languages[]
  status: string
  tagline: string
  watch_providers: Provider[];
}

export type Provider = {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export type TvShowResponse = {
  page: number
  results: SimpleObject[]
  total_pages: number
  total_results: number
}

export interface Season {
  id: number
  air_date: string
  episode_count: number
  episodes: Episode[]
  name: string
  overview: string
  poster_path: string
  season_number: number
  vote_average: number
  timesWatched: number;
}

export type Episode = {
  id: number
  air_date: string
  episode_number: number
  name: string
  overview: string
  runtime: number
  still_path: string
  vote_average: number
  season_number: number
  watched: boolean
  timesWatched: number;
}

// dictionary for status
export const ShowStatus = {
  0: 'Returning Series',
  1: 'Planned',
  2: 'In Production',
  3: 'Ended',
  4: 'Canceled',
  5: 'Pilot'
};

@Injectable({
  providedIn: 'root'
})
export class ApiShowsService {

  private BASE_API_URL: string = environment.BASE_API_URL;
  private headers = new HttpHeaders(environment.headers);

  constructor(private http: HttpClient,
              private generalApi: ApiService) {}

  //------------------------------------------------------------------------------------//
  //----------------------------   SHOWS  GETS  ----------------------------------------//
  //------------------------------------------------------------------------------------//

  getTvShowsByType(type: string, page = 1): Observable<SimpleObject[]> {
    return this.http
      .get<TvShowResponse>(`${this.BASE_API_URL}/tv/${type}?&language=en-US&page=${page}`, {headers: this.headers}).pipe(
        map((response: TvShowResponse) => {
          return response.results
            .filter((tvshow: any) => tvshow.poster_path !== null)
            .map((tvshow: any) => {
            const SimpleObject: SimpleObject = {
              id: tvshow.id,
              original_title: tvshow.original_title,
              title: tvshow.title,
              poster_path: tvshow.poster_path,
              type: "tvshow",
              popularity: tvshow.popularity,
              timesWatched: 0
            };
            return SimpleObject;
          });
        })
      )
  }

  getTrendingTvShows(): Observable<SimpleObject[]> {
    return this.http
      .get<TvShowResponse>(`${this.BASE_API_URL}/trending/tv/week?language=en-US`, {headers: this.headers}).pipe(
        map((response: TvShowResponse) => {
          return response.results
            .filter((tvshow: any) => tvshow.poster_path !== null)
            .map((tvshow: any) => {
            const SimpleObject: SimpleObject = {
              id: tvshow.id,
              original_title: tvshow.original_title,
              title: tvshow.title,
              poster_path: tvshow.poster_path,
              type: "tvshow",
              popularity: tvshow.popularity,
              timesWatched: 0
            };
            return SimpleObject;
          });
        })
      )
  }

  getTvShowById(id: string): Observable<ComplexTvshow> {
    return this.http.get<ComplexTvshow>(`${this.BASE_API_URL}/tv/${id}?append_to_response=watch/providers`, {headers: this.headers}).pipe(
      map((tvshow: any) => {
        let watchProvidersR = this.generalApi.getWatchProviders(tvshow)

        //remove duplicate providers based on provider_name
        watchProvidersR = watchProvidersR.filter((provider, index, self) =>
          index === self.findIndex((t) => (
            t.provider_name === provider.provider_name
          )));

        return {
          ...tvshow,
          poster_path: tvshow.poster_path,
          backdrop_path: tvshow.backdrop_path,
          watch_providers: watchProvidersR
        };
      })
    );
  }

  getTvShowSeasons(id: number, s_number: number): Observable<Season> {
    return this.http.get<Season>(`${this.BASE_API_URL}/tv/${id}/season/${s_number}`, {headers: this.headers}).pipe(
      map((response: any) => {
          return {
            ...response,
            poster_path: response.poster_path,
            episodes: response.episodes
          };
        }
      ))
  }

  getDaysUntiItsOut(episode: Episode) {
    const today = new Date();
    const releaseDate = new Date(episode.air_date);
    const timeDiff = releaseDate.getTime() - today.getTime();

    if (timeDiff < 0) 
      return -1;

    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  getTopRatedTvShows(): Observable<SimpleObject[]> {
    return this.http.get<TvShowResponse>(`${this.BASE_API_URL}/tv/top_rated?language=en-US`, { headers: this.headers }).pipe(
      map((response: TvShowResponse) => {
        return response.results
          .filter((tvshow: any) => tvshow.poster_path !== null)
          .map((tvshow: any) => {
          const SimpleObject: SimpleObject = {
            id: tvshow.id,
            original_title: tvshow.original_title,
            title: tvshow.title,
            poster_path: tvshow.poster_path,
            type: "tvshow",
            popularity: tvshow.popularity,
            timesWatched: 0
          };
          return SimpleObject;
        });
      })
    )
  }

  getShowStatus(status: string): number {
      for (const [key, value] of Object.entries(ShowStatus)) {
        if (value === status)
          return parseInt(key, 10);
      }
      return -1;
  }

}
