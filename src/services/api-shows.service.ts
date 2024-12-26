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

export type SavedEpisodeInfo = {
  showId: number
  einfo: EInfo[]
}

export type EInfo = {
  seasonNumber: number
  episodeNumber: number
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

  shows_filename = 'shows.json';
  episodes_filename = 'episodes.json';

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

  //------------------------------------------------------------------------------------//
  //----------------------------   SHOWS  FILE  ----------------------------------------//
  //------------------------------------------------------------------------------------//

  async isShowMarked(showID: number): Promise<boolean> {
    try {

      if (!await this.generalApi.checkIfFileExists(this.shows_filename)) {
        return false;
      }

      let showList: SimpleObject[] = [];


      return await  this.generalApi.readFromFile(this.shows_filename).then((data) => {
        let file = data;
        if (file.data) {
          try {
            showList = JSON.parse(file.data as string);
          } catch (error) {
            console.error('Error parsing JSON file:', error);
          }

          const show = showList.find(s => s.id === showID);
          return !!(show && show.timesWatched !== undefined);


        }
        return false;
      });

    } catch (e) {
      console.error('Error checking if show exists', e);
      return false;
    }
  }

  async saveEpisodeToFile(newEpisode: Episode, showID: number) {
    try {

      if (!await this.generalApi.checkIfFileExists(this.episodes_filename)) {
        return ;
      }

      let currentContentList: SavedEpisodeInfo[] = [];

      await this.generalApi.readFromFile(this.episodes_filename).then(async (data) => {
        let file = data;
        if (file.data) {
          try {
            currentContentList = JSON.parse(file.data as string) as SavedEpisodeInfo[];
          } catch (error) {
            console.error('Error parsing existing JSON file:', error);
          }
        }

        let show = currentContentList.find(s => s.showId === showID);

        if (!show)
        {
          show = {
            showId: showID,
            einfo: [{
              seasonNumber: newEpisode.season_number,
              episodeNumber: newEpisode.episode_number,
              timesWatched: newEpisode.timesWatched
            }]
          };
          currentContentList.push(show);
        }
        else {
          let episode = show.einfo.find(e => e.seasonNumber === newEpisode.season_number && e.episodeNumber === newEpisode.episode_number);

          if (!episode)
          {
            show.einfo.push({
              seasonNumber: newEpisode.season_number,
              episodeNumber: newEpisode.episode_number,
              timesWatched: newEpisode.timesWatched
            });
          }
          else
          {
            episode.timesWatched = episode.timesWatched ? episode.timesWatched + 1 : 1;
          }
        }

        const updatedContent = JSON.stringify(currentContentList, null, 2);
        await this.generalApi.writeToFile(this.episodes_filename, updatedContent);
      });

    } catch (e) {
      console.error('Unable to write file', e);
    }
  }

  async removeEpisodeFromFile(episode: Episode, showID: number) {
    try {

      if (!await this.generalApi.checkIfFileExists(this.episodes_filename)) {
        return ;
      }

      let currentContentList: SavedEpisodeInfo[] = [];

      await this.generalApi.readFromFile(this.episodes_filename).then((data) => {
        let file = data;
        if (file.data) {
          try {
            currentContentList = JSON.parse(file.data as string) as SavedEpisodeInfo[];
          } catch (error) {
            console.error('Error parsing existing JSON file:', error);
          }
        }
      });

      let show = currentContentList.find(s => s.showId === showID);
      if (!show)
        return;
      else {
        //get the episode from the show
        let episodeIndex = show.einfo.findIndex(e => e.seasonNumber === episode.season_number && e.episodeNumber === episode.episode_number);

        //if the episode is not in the show, return
        if (episodeIndex === -1) return;

        show.einfo.splice(episodeIndex, 1);
      }

      //if currentContentList is empty, remove the show from the list
      if (show.einfo.length === 0) {
        let showIndex = currentContentList.findIndex(s => s.showId === showID);
        currentContentList.splice(showIndex, 1);
      }

      const updatedContent = JSON.stringify(currentContentList, null, 2);

      await this.generalApi.writeToFile(this.episodes_filename, updatedContent);
    } catch (e) {
      console.error('Error checking if movie exists', e);
    }
  }

  async getAllEpisodesFromFile(showId: number): Promise<EInfo[]> {
    try {

      if (!await this.generalApi.checkIfFileExists(this.episodes_filename)) {
        return [];
      }

      let episodeList: SavedEpisodeInfo[] = [];

      return await this.generalApi.readFromFile(this.episodes_filename).then((data) => {
        let file = data;
        if (file.data) {
          try {
            episodeList = JSON.parse(file.data as string) as SavedEpisodeInfo[];
            episodeList = episodeList.filter(s => s.showId === showId);
          } catch (error) {
            console.error('Error parsing JSON file:', error);
          }

          if (episodeList.length > 0)
            return episodeList[0].einfo;
          else
            return [];
        }
        return [];
      });

    } catch (e) {
      console.error('Error checking if episodes exists', e);
      return [];
    }
  }

  getShowStatus(status: string): number {
      for (const [key, value] of Object.entries(ShowStatus)) {
        if (value === status)
          return parseInt(key, 10);
      }
      return -1;
  }

  async saveShowsToFile(newShow: ComplexTvshow, watched_times: number) {
    try {

      if (!await this.generalApi.checkIfFileExists(this.shows_filename)) {
        return;
      }

      let currentContentList: SimpleObject[] = [];

      await this.generalApi.readFromFile(this.shows_filename).then(async (data) => {
        let file = data;
        if (file.data) {
          try {
            currentContentList = JSON.parse(file.data as string) as SimpleObject[];
          } catch (error) {
            console.error('Error parsing existing JSON file:', error);
          }
        }

        //transform complexMOvie to SimpleObject
        const SimpleObject: SimpleObject = {
          id: newShow.id,
          original_title: newShow.original_name,
          title: newShow.name,
          poster_path: newShow.poster_path,
          type: "tvshow",
          popularity: newShow.popularity,
          timesWatched: watched_times,
          status: this.getShowStatus(newShow.status)
        };

        let updatedContent = '';

        if (currentContentList.find(s => s.id === newShow.id)) {
          let index = currentContentList.findIndex(s => s.id === newShow.id);
          currentContentList[index] = SimpleObject;
           updatedContent = JSON.stringify(currentContentList, null, 2);
        }
        else
        {
          currentContentList.push(SimpleObject);
           updatedContent = JSON.stringify(currentContentList, null, 2);
        }

        await this.generalApi.writeToFile(this.shows_filename, updatedContent);
      });

    } catch (e) {
      console.error('Unable to write file', e);
    }
  }

  async removeAllEpisodesFromFile(showID: number) {
    try {
      if (!await this.generalApi.checkIfFileExists(this.episodes_filename)) {
        return;
      }

      let currentContentList: SavedEpisodeInfo[] = [];

      await this.generalApi.readFromFile(this.episodes_filename).then(async (data) => {
        let file = data;
        if (file.data) {
          try {
            currentContentList = JSON.parse(file.data as string) as SavedEpisodeInfo[];
          } catch (error) {
            console.error('Error parsing existing JSON file:', error);
          }
        }

        let showIndex = currentContentList.findIndex(s => s.showId === showID);
        currentContentList.splice(showIndex, 1);

        const updatedContent = JSON.stringify(currentContentList, null, 2);
        await this.generalApi.writeToFile(this.episodes_filename, updatedContent);
      });

    } catch (e) {
      console.error('Error checking if movie exists', e);
    }
  }

}
