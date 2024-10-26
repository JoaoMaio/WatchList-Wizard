import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export interface SimpleObject {
  id: number;
  original_title: string;
  poster_path: string;
  title: string;
  type: string;
  popularity: number;
  runtime?: number; //only for saved movies
  // timesWatched?: number; //only for movies
  // saveType?: string; // toWatch, watched, watching, stoppedWatching
}

//--------------------------------------------------------------------------------//
//----------------------------   MOVIES   ----------------------------------------//

export interface MovieResponse {
  page: number;
  total_results: number;
  total_pages: number;
  results: SimpleObject[];
}

export interface ComplexMovie {
  adult: boolean;
  backdrop_path: string;
  belongs_to_collection: Collection;
  budget: number;
  genres: Genre[];
  homepage: string;
  id: number;
  imdb_id: string;
  origin_country: string[];
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;
  production_companies: Production_Company[];
  production_countries: Production_Country[];
  release_date: string;
  revenue: number;
  runtime: number;
  spoken_languages: Spoken_Languages[];
  status: string;
  tagline: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
  watch_providers: Provider[];
}

export interface Collection {
  id: number;
  name: string;
  poster_path: string;
  backdrop_path: string;
}

export interface Production_Company {
  id: number;
  logo_path: string;
  name: string;
  origin_country: string;
}

export interface Production_Country {
  iso_3166_1: string;
  name: string;
}

export interface Spoken_Languages {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export type Genre = {
  id: string
  name: string
}

export type GenresDot = {
  genres: Genre[]
}

//--------------------------------------------------------------------------------//
//----------------------------  TV SHOWS  ----------------------------------------//

export type ComplexTvshow = {
  id: number
  adult: boolean
  backdrop_path: string
  genre_ids: number[]
  name: string
  origin_country: string[]
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
}

export type SavedEpisodeInfo = {
  showId: number
  einfo: EInfo[]
}

export type EInfo = {
  seasonNumber: number
  episodeNumber: number
  runtime?: number
  // timesWatched?: number;
}


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private API_KEY: string = '75ed341317b0320f7fe3d41f435318b6';
  private BASE_API_URL: string = 'https://api.themoviedb.org/3/';
  private IMAGE_PATH: string = 'https://image.tmdb.org/t/p/w500';
  private BACKDROP_IMAGE_PATH: string = 'https://image.tmdb.org/t/p/w780';
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI3NWVkMzQxMzE3YjAzMjBmN2ZlM2Q0MWY0MzUzMThiNiIsIm5iZiI6MTcyODY4MjkxMy4xOTYwMDIsInN1YiI6IjY3MDk5YWQ0NTQxNjgwMjI4MWE1ZTFhMyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.5zc5-y6w12GWPHK0KH0iqmW10fgMpsZWbLj9RcNv3Eg"
  });

  buyProviders = ['Apple TV', 'Amazon Video', 'Google Play Movies', 'YouTube', 'Disney Plus'];
  flatrateProviders = ['Netflix', 'Amazon Prime Video', 'Disney Plus', 'Max'];


  constructor(private http: HttpClient) { }


  //get all watch providers from all countries and remove duplicates
  getWatchProviders(object: any): Provider[] {
    try {

      var response: Provider[] = [];
      let watchProviders = object['watch/providers']?.results;

      if (watchProviders) {
        for (const country in watchProviders) {
          if (watchProviders[country].flatrate) {
            for (const provider of watchProviders[country].flatrate) {
              if (!response.some(p => p.provider_id === provider.provider_id) && this.flatrateProviders.includes(provider.provider_name))
                response.push(provider);
            }
          }

          if (watchProviders[country].buy) {
            for (const provider of watchProviders[country].buy) {
              if (!response.some(p => p.provider_id === provider.provider_id) && this.buyProviders.includes(provider.provider_name))
                response.push(provider);
            }
          }
        }
      }
      //order response by display_priority
      response.sort((a, b) => a.display_priority - b.display_priority);
      return response;
    } catch (error) {
      console.error('Error fetching watch providers:', error);
      return [];
    }
  }

  async checkIfFileExists(filename: string): Promise<boolean> {
    try {
      // Try to get the file's statistics
      await Filesystem.stat({
        path: filename,
        directory: Directory.Documents,
      });
      // If no error, the file exists
      return true;
    } catch (e) {
      // If an error occurs, it means the file doesn't exist
      return false;
    }
  }

  doesBackDropExist(string: string | undefined): boolean { 
    if (!string) return false;

    return string.endsWith('null') ? false : true;
  }

  search(query: string, type: string, page: number = 1): Observable<SimpleObject[] | SimpleObject[]> {
    return this.http.get<MovieResponse | TvShowResponse>(`${this.BASE_API_URL}search/${type}?query=${query}&include_adult=false&language=en-US&page=${page}`, { headers: this.headers }).pipe(
      map((response: MovieResponse | TvShowResponse) => {
        if (type === 'movie') {
          return response.results.map((movie: any) => {
            const SimpleObject: SimpleObject = {
              id: movie.id,
              original_title: movie.original_title,
              title: movie.title,
              poster_path: `${this.IMAGE_PATH}${movie.poster_path}`,
              type: "movie",
              popularity: movie.popularity
            };
            return SimpleObject;
          });
        }
        else {
          return response.results.map((tvshow: any) => {
            const SimpleObject: SimpleObject = {
              id: tvshow.id,
              original_title: tvshow.original_name,
              title: tvshow.name,
              poster_path: `${this.IMAGE_PATH}${tvshow.poster_path}`,
              type: "tvshow",
              popularity: tvshow.popularity
            };
            return SimpleObject;
          });
        }
      })
    )
  }

  async removeShowOrMovieFromFile(objectId: number, type: string) {
    try {
      var filename = '';

      if (type === 'movie')
        filename = 'movies.json';
      else
        filename = 'shows.json';

      let currentContentList: SimpleObject[] = [];

      if (await this.checkIfFileExists(filename)) {
        const file = await Filesystem.readFile({
          path: filename,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });

        if (file.data) {
          try {
            currentContentList = JSON.parse(file.data as string) as SimpleObject[];
          }
          catch (error) {
            console.error('Error parsing existing JSON file:', error);
            throw new Error('Invalid JSON in file.');
          }
        }
      }

      //get the show from the list
      let showIndex = currentContentList.findIndex(s => s.id === objectId);
      if (showIndex === -1) return;

      //remove the show from the list
      currentContentList.splice(showIndex, 1);
      const updatedContent = JSON.stringify(currentContentList, null, 2);

      await Filesystem.writeFile({
        path: filename,
        data: updatedContent,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

    }
    catch (e) {
      console.error('Error checking if movie exists', e);
    }
  }

  async getAllShowsOrMovies(quantity: number = 0, type: string): Promise<SimpleObject[]> {
    try {

      var filename = '';

      if (type === 'movie')
        filename = 'movies.json';
      else
        filename = 'shows.json';

      if (!await this.checkIfFileExists(filename)) {
        return [];
      }

      const file = await Filesystem.readFile({
        path: filename,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      let showList: SimpleObject[] = [];

      if (file.data) 
      {
        try {
          showList = JSON.parse(file.data as string);
        } catch (error) {
          console.error('Error parsing JSON file:', error);
          throw new Error('Invalid JSON in file.');
        }
        
        if (quantity > 0)
        {
          if (showList.length-quantity-1 < 0)
            return showList;

          showList = showList.slice(showList.length-quantity, showList.length);
          return showList;
        }
        else
          return showList;
      }

      return [];
    } catch (e) {
      console.error('Error checking if movie exists', e);
      return [];
    }
  }


  //--------------------------------------------------------------------------------//
  //----------------------------   MOVIES   ----------------------------------------//
  //--------------------------------------------------------------------------------//

  //Movie Gets

  getMoviesByType(type: string, count = 20): Observable<SimpleObject[]> {
    return this.http.get<MovieResponse>(`${this.BASE_API_URL}/movie/${type}`, { headers: this.headers }).pipe(
      map((response: MovieResponse) => {
        return response.results.map((movie: any) => {
          const SimpleObject: SimpleObject = {
            id: movie.id,
            original_title: movie.original_title,
            title: movie.title,
            poster_path: `${this.IMAGE_PATH}${movie.poster_path}`,
            type: "movie",
            popularity: movie.popularity
          };
          return SimpleObject;
        });
      })
    )
  }

  getTrendingMovies(): Observable<SimpleObject[]> {
    return this.http.get<MovieResponse>(`${this.BASE_API_URL}/trending/movie/week?language=en-US`, { headers: this.headers }).pipe(
      map((response: MovieResponse) => {
        return response.results.map((movie: any) => {
          const SimpleObject: SimpleObject = {
            id: movie.id,
            original_title: movie.original_title,
            title: movie.title,
            poster_path: `${this.IMAGE_PATH}${movie.poster_path}`,
            type: "movie",
            popularity: movie.popularity
          };
          return SimpleObject;
        });
      })
    )
  }

  getMovieById(id: string): Observable<ComplexMovie> {
    return this.http.get<ComplexMovie>(`${this.BASE_API_URL}/movie/${id}?append_to_response=watch/providers`, { headers: this.headers }).pipe(
      map((movie: any) => {
        let watchProvidersR = this.getWatchProviders(movie)

        return {
          ...movie,
          poster_path: `${this.IMAGE_PATH}${movie.poster_path}`,
          backdrop_path: `${this.BACKDROP_IMAGE_PATH}${movie.backdrop_path}`,
          watch_providers: watchProvidersR // Save the selected watch provider          
        };
      })
    )
  }

  //Movie File Related 
  async saveMoviesToFile(newMovie: ComplexMovie) {
    try {
      const filename = 'movies.json';
      let currentContentList: SimpleObject[] = [];

      const fileExists = await this.checkIfFileExists(filename);

      if (fileExists) {
        const file = await Filesystem.readFile({
          path: filename,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });

        if (file.data) {
          try {
            currentContentList = JSON.parse(file.data as string) as SimpleObject[];
          }
          catch (error) {
            console.error('Error parsing existing JSON file:', error);
            throw new Error('Invalid JSON in file.');
          }
        }
      }

      const SimpleObject: SimpleObject = {
        id: newMovie.id,
        original_title: newMovie.original_title,
        title: newMovie.title,
        poster_path: newMovie.poster_path,
        type: "movie",
        popularity: newMovie.popularity,
        runtime: newMovie.runtime
      };

      currentContentList.push(SimpleObject);
      const updatedContent = JSON.stringify(currentContentList, null, 2);

      // Write the updated content back to the file
      await Filesystem.writeFile({
        path: filename,
        data: updatedContent,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
    } catch (e) {
      console.error('Unable to write file', e);
    }
  }

  async movieExistsById(movieId: number): Promise<boolean> {
    try {
      const filename = 'movies.json';
      const fileExists = await this.checkIfFileExists(filename);

      if (!fileExists) {
        return false;
      }

      const file = await Filesystem.readFile({
        path: filename,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      let movieList: SimpleObject[] = [];

      if (file.data) {
        try {

          movieList = JSON.parse(file.data as string) as SimpleObject[];
        } catch (error) {
          console.error('Error parsing JSON file:', error);
          throw new Error('Invalid JSON in file.');
        }

        const movieExists = movieList.some(movie => movie.id === movieId);
        return movieExists;
      }
      return false;
    } catch (e) {
      console.error('Error checking if movie exists', e);
      return false;
    }
  }

  //--------------------------------------------------------------------------------//
  //----------------------------  TV SHOWS  ----------------------------------------//
  //--------------------------------------------------------------------------------//

  //Show Gets

  getTvShowsByType(type: string, count = 20): Observable<SimpleObject[]> {
    return this.http
      .get<TvShowResponse>(`${this.BASE_API_URL}/tv/${type}?&language=en-US`, { headers: this.headers }).pipe(
        map((response: TvShowResponse) => {
          return response.results.map((tvshow: any) => {
            const SimpleObject: SimpleObject = {
              id: tvshow.id,
              original_title: tvshow.original_title,
              title: tvshow.title,
              poster_path: `${this.IMAGE_PATH}${tvshow.poster_path}`,
              type: "tvshow",
              popularity: tvshow.popularity
            };
            return SimpleObject;
          });
        })
      )
  }

  getTrendingTvShows(): Observable<SimpleObject[]> {
    return this.http
      .get<TvShowResponse>(`${this.BASE_API_URL}/trending/tv/week?language=en-US`, { headers: this.headers }).pipe(
        map((response: TvShowResponse) => {
          return response.results.map((tvshow: any) => {
            const SimpleObject: SimpleObject = {
              id: tvshow.id,
              original_title: tvshow.original_title,
              title: tvshow.title,
              poster_path: `${this.IMAGE_PATH}${tvshow.poster_path}`,
              type: "tvshow",
              popularity: tvshow.popularity

            };
            return SimpleObject;
          });
        })
      )
  }

  getTvShowById(id: string): Observable<ComplexTvshow> {
    return this.http.get<ComplexTvshow>(`${this.BASE_API_URL}/tv/${id}?append_to_response=watch/providers`, { headers: this.headers }).pipe(
      map((tvshow: any) => {

        let watchProvidersR = this.getWatchProviders(tvshow)

        return {
          ...tvshow,
          poster_path: `${this.IMAGE_PATH}${tvshow.poster_path}`,
          backdrop_path: `${this.BACKDROP_IMAGE_PATH}${tvshow.backdrop_path}`,
          watch_providers: watchProvidersR // Save the selected watch provider
        };
      })
    );
  }

  getTvShowSeasons(id: number, s_number: number): Observable<Season> {
    return this.http.get<Season>(`${this.BASE_API_URL}/tv/${id}/season/${s_number}`, { headers: this.headers }).pipe(
      map((response: any) => {
        return {
          ...response,
          poster_path: `${this.IMAGE_PATH}${response.poster_path}`,
          episodes: response.episodes.map((episode: any) => {
            return {
              ...episode,
              still_path: `${this.IMAGE_PATH}${episode.still_path}`
            }
          }),
        };
      }
      ))
  }

  //Show File Related

  async showExistsById(showID: number): Promise<boolean> {
    try {
      const filename = 'shows.json';

      if (!await this.checkIfFileExists(filename)) {
        return false;
      }

      const file = await Filesystem.readFile({
        path: filename,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      let showList: SimpleObject[] = [];

      if (file.data) {
        try {
          showList = JSON.parse(file.data as string);
        } catch (error) {
          console.error('Error parsing JSON file:', error);
          throw new Error('Invalid JSON in file.');
        }

        const movieExists = showList.some(show => show.id === showID);
        return movieExists;
      }
      return false;
    } catch (e) {
      console.error('Error checking if movie exists', e);
      return false;
    }
  }

  async saveEpisodeToFile(newEpisode: Episode, showID: number) {
    try {
      const filename = 'episodes.json';
      let currentContentList: SavedEpisodeInfo[] = [];

      if (await this.checkIfFileExists(filename)) {
        const file = await Filesystem.readFile({
          path: filename,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });

        if (file.data) {
          try {
            currentContentList = JSON.parse(file.data as string) as SavedEpisodeInfo[];
          }
          catch (error) {
            console.error('Error parsing existing JSON file:', error);
            throw new Error('Invalid JSON in file.');
          }
        }
      }

      let show = currentContentList.find(s => s.showId === showID);

      //if the show is not in the list, add it
      if (!show) {
        show = {
          showId: showID,
          einfo: [{
            seasonNumber: newEpisode.season_number,
            episodeNumber: newEpisode.episode_number,
            runtime: newEpisode.runtime ? newEpisode.runtime : 0
          }]
        };
        currentContentList.push(show);
      }
      else {
        //get the episode from the show
        let episode = show.einfo.find(e => e.seasonNumber === newEpisode.season_number && e.episodeNumber === newEpisode.episode_number);

        //if the episode is not in the show, add it
        if (!episode) {
          show.einfo.push({
            seasonNumber: newEpisode.season_number,
            episodeNumber: newEpisode.episode_number,
            runtime: newEpisode.runtime ? newEpisode.runtime : 0
          });
        }
      }

      const updatedContent = JSON.stringify(currentContentList, null, 2);

      await Filesystem.writeFile({
        path: filename,
        data: updatedContent,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
    }
    catch (e) {
      console.error('Unable to write file', e);
    }
  }

  async removeEpisodeFromFile(episode: Episode, showID: number) {
    try {
      const filename = 'episodes.json';
      let currentContentList: SavedEpisodeInfo[] = [];

      if (await this.checkIfFileExists(filename)) {
        const file = await Filesystem.readFile({
          path: filename,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });

        if (file.data) {
          try {
            currentContentList = JSON.parse(file.data as string) as SavedEpisodeInfo[];
          }
          catch (error) {
            console.error('Error parsing existing JSON file:', error);
            throw new Error('Invalid JSON in file.');
          }
        }
      }

      let show = currentContentList.find(s => s.showId === showID);
      if (!show) return;
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

      await Filesystem.writeFile({
        path: filename,
        data: updatedContent,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
    }
    catch (e) {
      console.error('Error checking if movie exists', e);
    }
  }

  async getAllEpisodesFromFile(showId: number): Promise<EInfo[]> {
    try {
      const filename = 'episodes.json';

      if (!await this.checkIfFileExists(filename)) {
        return [];
      }

      const file = await Filesystem.readFile({
        path: filename,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      let episodeList: SavedEpisodeInfo[] = [];

      if (file.data) {
        try {
          episodeList = JSON.parse(file.data as string) as SavedEpisodeInfo[];
          episodeList = episodeList.filter(s => s.showId === showId);
        }
        catch (error) {
          console.error('Error parsing JSON file:', error);
          throw new Error('Invalid JSON in file.');
        }

        if (episodeList.length > 0)
          return episodeList[0].einfo;
        else
          return [];
      }
      return [];
    }
    catch (e) {
      console.error('Error checking if episodes exists', e);
      return [];
    }
  }

  async saveShowsToFile(newShow: ComplexTvshow) {
    try {
      const filename = 'shows.json';
      let currentContentList: SimpleObject[] = [];

      if (await this.checkIfFileExists(filename)) {
        const file = await Filesystem.readFile({
          path: filename,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });

        if (file.data) {
          try {
            currentContentList = JSON.parse(file.data as string) as SimpleObject[];
          }
          catch (error) {
            console.error('Error parsing existing JSON file:', error);
            throw new Error('Invalid JSON in file.');
          }
        }
      }

      //transform complexMOvie to SimpleObject
      const SimpleObject: SimpleObject = {
        id: newShow.id,
        original_title: newShow.original_name,
        title: newShow.name,
        poster_path: newShow.poster_path,
        type: "tvshow",
        popularity: newShow.popularity
      };

      currentContentList.push(SimpleObject);
      const updatedContent = JSON.stringify(currentContentList, null, 2);

      await Filesystem.writeFile({
        path: filename,
        data: updatedContent,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
    }
    catch (e) {
      console.error('Unable to write file', e);
    }
  }

  async removeAllEpisodesFromFile(showID: number) {
    try {
      const filename = 'episodes.json';
      let currentContentList: SavedEpisodeInfo[] = [];

      if (await this.checkIfFileExists(filename)) {
        const file = await Filesystem.readFile({
          path: filename,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });

        if (file.data) {
          try {
            currentContentList = JSON.parse(file.data as string) as SavedEpisodeInfo[];
          }
          catch (error) {
            console.error('Error parsing existing JSON file:', error);
            throw new Error('Invalid JSON in file.');
          }
        }
      }

      let showIndex = currentContentList.findIndex(s => s.showId === showID);
      currentContentList.splice(showIndex, 1);

      const updatedContent = JSON.stringify(currentContentList, null, 2);

      await Filesystem.writeFile({
        path: filename,
        data: updatedContent,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

    }
    catch (e) {
      console.error('Error checking if movie exists', e);
    }
  }

  calculateShowRuntime(showId: number): Promise<number> {
    return new Promise(async (resolve, reject) => {
      let total = 0;
      let episodes = await this.getAllEpisodesFromFile(showId);
      episodes.forEach(e => {
        total += e.runtime ? e.runtime : 0;
      });
      resolve(total);
    });
  }



  // getSimilarMovies(id: string, count = 20) {
  //   return this.http
  //     .get<MovieResponse>(
  //       `${this.BASE_API_URL}/movie/${id}/similar?api_key=${this.apiKey}`
  //     )
  //     .pipe(map((data) => data.results.slice(0, count)))
  // }


  // getMovieVideos(id: string) {
  //   return this.http
  //     .get<VideosDto>(
  //       `${this.BASE_API_URL}/movie/${id}/videos?api_key=${this.apiKey}`
  //     )
  //     .pipe(map((data) => data.results))
  // }

  // getMovieImages(id: string) {
  //   return this.http
  //     .get<ImagesDto>(
  //       `${this.BASE_API_URL}/movie/${id}/images?api_key=${this.apiKey}`
  //     )
  //     .pipe(map((data) => data.backdrops))
  // }

  // getMovieCast(id: string) {
  //   return this.http
  //     .get<CreditsDto>(
  //       `${this.BASE_API_URL}/movie/${id}/credits?api_key=${this.apiKey}`
  //     )
  //     .pipe(map((data) => data.cast))
  // }



  // getMovieGenres() {
  //   return this.http
  //     .get<GenresDot>(`${this.BASE_API_URL}/genre/movie/list?api_key=${this.apiKey}`)
  //     .pipe(map((data) => data.genres))
  // }

  // getMoviesByGenre(genreId?: string, pageNumber = 1) {
  //   return genreId
  //     ? this.http.get<MovieResponse>(
  //         `${this.BASE_API_URL}/discover/movie?with_genres=${genreId}&page=${pageNumber}&api_key=${this.apiKey}`
  //       )
  //     : this.http.get<MovieResponse>(
  //         `${this.BASE_API_URL}/movie/popular?api_key=${this.apiKey}`
  //       )
  // }

}