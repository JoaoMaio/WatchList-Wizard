import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {forkJoin, Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {Directory, Encoding, Filesystem, ReadFileResult} from '@capacitor/filesystem';
import {environment} from '../environment';
import {ComplexMovie, MovieResponse, MovieStatus} from './api-movies.service';
import {ComplexTvshow, Episode, Provider, Season, ShowStatus, TvShowResponse} from './api-shows.service';
import { SimpleDatabaseObject } from './sqlite.service';

export interface GeneralItem {
  id: number;
  poster_path: string;
  title: string;
  type: string;
}

export interface SimpleObject {
  id: number;
  original_title: string;
  poster_path: string;
  title: string;
  type: string;
  popularity: number;
  runtime?: number;
  timesWatched: number;
  status?: number;
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

export const EmptyEpisode: Episode = {
  id: 0,
  air_date: '',
  episode_number: 0,
  name: '',
  overview: '',
  runtime: 0,
  still_path: '',
  vote_average: 0,
  season_number: 0,
  watched: false,
  timesWatched: 0
}

export const EmptyTvShow: ComplexTvshow = {
  id: 0,
  backdrop_path: '',
  genres: [],
  name: '',
  original_language: '',
  original_name: '',
  overview: '',
  popularity: 0,
  poster_path: '',
  release_date: '',
  video: false,
  vote_average: 0,
  vote_count: 0,
  episode_run_time: '',
  type: '',
  in_production: false,
  languages: [],
  last_air_date: '',
  first_air_date: '',
  last_episode_to_air: EmptyEpisode,
  next_episode_to_air: EmptyEpisode,
  number_of_episodes: 0,
  number_of_seasons: 0,
  spoken_languages: [],
  status: '',
  tagline: '',
  watch_providers: []
}

export const EmptyMovie: ComplexMovie = {
  adult: false,
  backdrop_path: '',
  belongs_to_collection: {
    id: 0,
    name: '',
    poster_path: '',
    backdrop_path: ''
  },
  budget: 0,
  genres: [],
  homepage: '',
  id: 0,
  imdb_id: '',
  origin_country: [],
  original_language: '',
  original_title: '',
  overview: '',
  popularity: 0,
  poster_path: '',
  production_companies: [],
  production_countries: [],
  release_date: '',
  revenue: 0,
  runtime: 0,
  spoken_languages: [],
  status: '',
  tagline: '',
  title: '',
  video: false,
  vote_average: 0,
  vote_count: 0,
  watch_providers: []
}

export const EmptySimpleObject: SimpleObject = {
  id: 0,
  original_title: '',
  poster_path: '',
  title: '',
  type: '',
  popularity: 0,
  timesWatched: 0
}

export const EmptySeason: Season = {
  id: 0,
  air_date: '',
  episode_count: 0,
  episodes: [],
  name: '',
  overview: '',
  poster_path: '',
  season_number: 0,
  vote_average: 0,
  timesWatched: 0
}

export type SimplePerson= {
  id: number;
  poster_path: string;
  title: string;
  type: string;
  popularity: number;
}

export type Person = {
  id : number;
  name: string;
  known_for_department: string;
  profile_path: string;
  birthday: string;
  place_of_birth: string;
  deathday: string;
  biography: string;
}

export type Credits = {
  object : SimpleObject;
  character?: string;
  job?: string;
}

export const EmptyPerson  : Person = {
  id : 0,
  name: '',
  known_for_department: '',
  profile_path: '',
  birthday: '',
  place_of_birth: '',
  deathday: '',
  biography: ''
}

export type SimpleCharacter = {
  id: number;
  name: string;
  profile_path: string;
  popularity: number;
  character: string;
}

export const buyProviders = ['Apple TV', 'Amazon Video', 'Google Play Movies', 'YouTube', 'Disney Plus'];
export const flatrateProviders = ['Netflix', 'Amazon Prime Video', 'Disney Plus', 'Max'];

export const ShowGenre = {
  10759: 'Action & Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  9648: 'Mystery',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10768: 'War & Politics',
  37: 'Western'
};

export const MovieGenre = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};



@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private BASE_API_URL: string = environment.BASE_API_URL;
  private headers = new HttpHeaders(environment.headers);

  constructor(private http: HttpClient) { }

  // Get watch providers
  getWatchProviders(object: any): Provider[] {
    try {

      let response: Provider[] = [];
      let watchProviders = object['watch/providers']?.results;

      if (watchProviders) {
        for (const country in watchProviders) {
          if (watchProviders[country].flatrate) {
            for (const provider of watchProviders[country].flatrate) {
              if (!response.some(p => p.provider_id === provider.provider_id) && flatrateProviders.includes(provider.provider_name))
                response.push(provider);
            }
          }

          if (watchProviders[country].buy) {
            for (const provider of watchProviders[country].buy) {
              if (!response.some(p => p.provider_id === provider.provider_id) && buyProviders.includes(provider.provider_name))
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

  // Check if the backdrop exists
  doesBackDropExist(string: string | undefined): boolean {
    if (!string) return false;

    return !string.endsWith('null');
  }

  // Search in their database
  searchInDatabase(query: string, type: string, page: number = 1): Observable<[SimpleObject[], number]> {
    return this.http.get<MovieResponse | TvShowResponse>(`${this.BASE_API_URL}search/${type}?query=${query}&include_adult=false&language=en-US&page=${page}`, { headers: this.headers }).pipe(
      map((response: MovieResponse | TvShowResponse) => {
        if (type === 'movie') {
          const items = response.results.map((movie: any) => {
            const SimpleObject: SimpleObject = {
              id: movie.id,
              original_title: movie.original_title,
              title: movie.title,
              poster_path: movie.poster_path,
              type: "movie",
              popularity: movie.popularity,
              timesWatched: 0
            };
            return SimpleObject;
          });
          return [items, response.total_pages];
        }
        else {
          const items = response.results.map((tvshow: any) => {
            const SimpleObject: SimpleObject = {
              id: tvshow.id,
              original_title: tvshow.original_name,
              title: tvshow.name,
              poster_path: tvshow.poster_path,
              type: "tvshow",
              popularity: tvshow.popularity,
              timesWatched: 0
            };
            return SimpleObject;
          });
          return [items, response.total_pages];
        }
      })
    )
  }

  searchPeople(query: string, page: number = 1): Observable<[SimplePerson[], number]> {
    return this.http.get(`${this.BASE_API_URL}search/person?query=${query}&include_adult=false&language=en-US&page=${page}`, { headers: this.headers }).pipe(
      map((response: any) => {
        const items = response.results.map((person: any) => {
          const SimplePerson: SimplePerson = {
            id: person.id,
            title: person.name,
            poster_path: person.profile_path,
            popularity: person.popularity,
            type: "person"
          };
          return SimplePerson;
        });
        return [items, response.total_pages];
      })
    );
  }

  getCredits(id: number, type: string): Observable<SimpleCharacter[]> {
    return this.http.get(`${this.BASE_API_URL}${type}/${id}/credits`, { headers: this.headers }).pipe(
      map((response: any) => {
        return response.cast
          .map((credit: any) => {
            const SimpleCharacter: SimpleCharacter = {
              id: credit.id,
              name: credit.name,
              profile_path: credit.profile_path,
              popularity: credit.popularity,
              character: credit.character
            };
            return SimpleCharacter;
          })
          .sort((a: SimpleCharacter, b: SimpleCharacter) => b.popularity - a.popularity)
          .slice(0, 30);
      })
    );
  }

  getPersonDetails(id: number): Observable<Person> {
    return this.http.get(`${this.BASE_API_URL}person/${id}`, { headers: this.headers }).pipe(
      map((response: any) => {
        const person: Person = {
          id: response.id,
          name: response.name,
          known_for_department: response.known_for_department,
          profile_path: response.profile_path,
          birthday: response.birthday,
          place_of_birth: response.place_of_birth,
          deathday: response.deathday,
          biography: response.biography
        };
        return person;
      })
    );
  }

  isValidTvCharacter(object: any): boolean {

    // return object.poster_path && (object.name && object.original_name && object.character && !object.character.includes('Self') && !object.character.includes('self') && !object.character.includes('Himself') && !object.character.includes('himself'));

    // Check if  has a poster, a name, an original name and a character
    if (!object.poster_path || !object.name || !object.original_name || !object.character) return false;

    // Check if the character is not a self role
    return !(object.character.includes('Self') ||
      object.character.includes('self') ||
      object.character.includes('Himself') ||
      object.character.includes('himself') ||
      object.character.includes('Herself') ||
      object.character.includes('herself'));


  }

  isValidMovieCharacter(object: any): boolean {
    // Check if  has a poster, a title, an original title and a character
    return !(!object.poster_path || !object.title || !object.original_title);
  }

  getPersonKnownFor(id: number): Observable<[Credits[], Credits[]]> {
    return this.http.get(`${this.BASE_API_URL}person/${id}/combined_credits`, { headers: this.headers }).pipe(
      map((response: any) => {
        let itemsCast = response.cast
          .filter((object: any) => {
            if (object.media_type === 'tv')
              return this.isValidTvCharacter(object);
            else if (object.media_type === 'movie')
              return this.isValidMovieCharacter(object);
            return false;
          })
          .map((object: any) => {
            const SimpleObject: SimpleObject = {
              id: object.id,
              original_title: object.original_name,
              title: object.name,
              poster_path: object.poster_path,
              type: "tvshow",
              popularity: object.popularity,
              timesWatched: 0
            };

            if (object.media_type === 'movie')
              SimpleObject.type = "movie";

            const credit: Credits = {
              object: SimpleObject,
              character: object.character
            };

            return credit;
          });

        let itemsCrew = response.crew
          .filter((object: any) => {
            if (object.media_type === 'tv')
              return this.isValidTvCharacter(object);
            else if (object.media_type === 'movie')
              return this.isValidMovieCharacter(object);
            return false;
          })
          .map((object: any) => {
            const SimpleObject: SimpleObject = {
              id: object.id,
              original_title: object.original_title,
              title: object.title,
              poster_path: object.poster_path,
              type: "tvshow",
              popularity: object.popularity,
              timesWatched: 0
            };

            if (object.media_type === 'movie')
              SimpleObject.type = "movie";

            const credit: Credits = {
              object: SimpleObject,
              job: object.job
            };

            return credit;
          });

        // Remove duplicates by using a Set to track seen IDs
          itemsCast = itemsCast.filter((item: Credits, index: number, self: Credits[]) => {
            return self.findIndex((i:Credits) => i.object.id === item.object.id) === index;
          });

          itemsCrew = itemsCrew.filter((item: Credits, index: number, self: Credits[]) => {
            return self.findIndex((i:Credits ) => i.object.id === item.object.id) === index;
          });

          return [itemsCast, itemsCrew];

      })
    );
  }

  searchInDatabaseMulti(query: string, page: number = 1): Observable<[SimpleObject[], number]> {
    return new Observable<[SimpleObject[], number]>((observer) => {
      let movieList: SimpleObject[] = [];
      let tvList: SimpleObject[] = [];
      let totalPages = 0;

      this.searchInDatabase(query, 'movie', page).subscribe({
      next: (response) => {
        movieList = response[0];
        totalPages = response[1];

        this.searchInDatabase(query, 'tv', page).subscribe({
        next: (response) => {
          tvList = response[0];
          totalPages = Math.max(totalPages, response[1]);

          const combinedList = movieList.concat(tvList);
          observer.next([combinedList, totalPages]);
          observer.complete();
        },
        error: (err) => observer.error(err)
        });
      },
      error: (err) => observer.error(err)
      });
    });

  }

  getSimilarShowOrMovie(id: number, type: string, page: number): Observable<SimpleObject[]> {
    return this.http.get<MovieResponse | TvShowResponse>(`${this.BASE_API_URL}${type}/${id}/similar?include_adult=false&language=en-US&page=${page}`, { headers: this.headers }).pipe(
      map((response: MovieResponse | TvShowResponse) => {
        if (type === 'movie') 
        {
          const items = response.results
          .filter((movie: any) => movie.poster_path !== null)
          .map((movie: any) => {
            const SimpleObject: SimpleObject = {
              id: movie.id,
              original_title: movie.original_title,
              title: movie.title,
              poster_path: movie.poster_path,
              type: "movie",
              popularity: movie.popularity,
              timesWatched: 0
            };
            return SimpleObject;
          });
          return items;
        }
        else 
        {
          const items = response.results
          .filter((tvshow: any) => tvshow.poster_path !== null)
          .map((tvshow: any) => {
            const SimpleObject: SimpleObject = {
              id: tvshow.id,
              original_title: tvshow.original_name,
              title: tvshow.name,
              poster_path: tvshow.poster_path,
              type: "tvshow",
              popularity: tvshow.popularity,
              timesWatched: 0
            };
            return SimpleObject;
          });
          return items;
        }
      })
    );
  }

  getByGenreShowOrMovie(genre: string, type: string, page: number): Observable<SimpleObject[]> {
    return this.http.get<MovieResponse | TvShowResponse>(`${this.BASE_API_URL}discover/${type}?with_genres=${genre}&include_adult=false&language=en-US&page=${page}`, { headers: this.headers }).pipe(
      map((response: MovieResponse | TvShowResponse) => {
        if (type === 'movie') {
          const items = response.results.map((movie: any) => {
            const SimpleObject: SimpleObject = {
              id: movie.id,
              original_title: movie.original_title,
              title: movie.title,
              poster_path: movie.poster_path,
              type: "movie",
              popularity: movie.popularity,
              timesWatched: 0
            };
            return SimpleObject;
          });
          return items;
        }
        else {
          const items = response.results.map((tvshow: any) => {
            const SimpleObject: SimpleObject = {
              id: tvshow.id,
              original_title: tvshow.original_name,
              title: tvshow.name,
              poster_path: tvshow.poster_path,
              type: "tvshow",
              popularity: tvshow.popularity,
              timesWatched: 0
            };
            return SimpleObject;
          });
          return items;
        }
      })
    );
  }

  findByIMDBId(imdb_id: string): Observable<[SimpleDatabaseObject, number]> {
    return this.http.get(`${this.BASE_API_URL}find/${imdb_id}?external_source=imdb_id`, { headers: this.headers }).pipe(
      switchMap((response: any) => {
        const object = response.movie_results[0] || response.tv_results[0];
        const SimpleObject: SimpleDatabaseObject = {
          id: object.id,
          original_title: object.original_title || object.original_name,
          poster_path: object.poster_path,
          status: -1,
          timesWatched: 0,
          runtime: 0,
        };
  
        // Create a new observable that will resolve both the status and the runtime sequentially
        if (object.media_type === 'movie') {
          return this.getMovieStatusAndRuntimeById(object.id).pipe(
            map(status => {
              SimpleObject.status = this.getMovieStatus(status[0]);
              const runtime = status[1]; // get runtime from the status
              return [SimpleObject, runtime] as [SimpleDatabaseObject, number]; // Return a tuple
            })
          );
        } else {
          return this.getTvShowStatusById(object.id).pipe(
            map(status => {
              SimpleObject.status = this.getShowStatus(status);
              const runtime = 0; // TV shows may not have runtime, or handle as needed
              return [SimpleObject, runtime] as [SimpleDatabaseObject, number]; // Return a tuple
            })
          );
        }
      })
    );
  }
  
  

  getMovieStatus(status: string): number {
      for (const [key, value] of Object.entries(MovieStatus)) {
        if (value === status)
          return parseInt(key, 10);
      }
      return -1;
  }

  getShowStatus(status: string): number {
      for (const [key, value] of Object.entries(ShowStatus)) {
        if (value === status)
          return parseInt(key, 10);
      }
      return -1;
  }

  getMovieStatusAndRuntimeById(id: number): Observable<[string, number]> {
    return this.http.get<ComplexMovie>(`${this.BASE_API_URL}/movie/${id}`, { headers: this.headers }).pipe(
      map((movie: any) => {
        return [movie.status, movie.runtime];
      })
    )
  }

  getTvShowStatusById(id: string): Observable<string> {
    return this.http.get<ComplexTvshow>(`${this.BASE_API_URL}/tv/${id}`, {headers: this.headers}).pipe(
      map((tvshow: any) => {
        return tvshow.status;
      })
    );
  }


  //-----------------------------------------------------------------------------------------//
  //-----------------------------------------------------------------------------------------//

  // Get images for object (show or movie)
  getImages(id: number, type: string): Observable<string[]> {
    return this.http.get(`${this.BASE_API_URL}${type}/${id}/images`, { headers: this.headers }).pipe(
      map((response: any) => {
        return response.backdrops.map((image: any) => {
          const img : string = image.file_path ;
          return img;
        });
      })
    )
  }

  addShowRuntimeToStorage(episoderuntime : number): void {
    var totalShowWatchedRuntime = Number(localStorage.getItem('totalShowWatchedRuntime'));
    var watchedEpisodes = Number(localStorage.getItem('numberWatchedEpisodes'));

    if(totalShowWatchedRuntime != null && watchedEpisodes != null)
    {
      totalShowWatchedRuntime += episoderuntime;
      watchedEpisodes += 1;
    }
    else
    {
      totalShowWatchedRuntime = episoderuntime;
      watchedEpisodes = 1;
    }

    localStorage.setItem('totalShowWatchedRuntime', totalShowWatchedRuntime.toString());
    localStorage.setItem('numberWatchedEpisodes', watchedEpisodes.toString());
  }

  removeShowRuntimeToStorage(episoderuntime : number): void {
    var totalShowWatchedRuntime = Number(localStorage.getItem('totalShowWatchedRuntime'));
    var watchedEpisodes = Number(localStorage.getItem('numberWatchedEpisodes'));

    if(totalShowWatchedRuntime != null && watchedEpisodes != null)
    {
      totalShowWatchedRuntime -= episoderuntime;
      watchedEpisodes -= 1;
    }
    else
    {
      totalShowWatchedRuntime = 0;
      watchedEpisodes = 0;
    }

    localStorage.setItem('totalShowWatchedRuntime', totalShowWatchedRuntime.toString());
    localStorage.setItem('numberWatchedEpisodes', watchedEpisodes.toString());
  }

  addMovieRuntimeToStorage(movieruntime : number): void {
    var totalMovieWatchedRuntime = Number(localStorage.getItem('totalMovieWatchedRuntime'));
    var watchedMovies = Number(localStorage.getItem('numberWatchedMovies'));

    if(totalMovieWatchedRuntime != null && watchedMovies != null)
    {
      totalMovieWatchedRuntime += movieruntime;
      watchedMovies += 1;
    }
    else
    {
      totalMovieWatchedRuntime = movieruntime;
      watchedMovies = 1;
    }

    localStorage.setItem('totalMovieWatchedRuntime', totalMovieWatchedRuntime.toString());
    localStorage.setItem('numberWatchedMovies', watchedMovies.toString());
  }

  removeMovieRuntimeToStorage(movieruntime : number): void {
    var totalMovieWatchedRuntime = Number(localStorage.getItem('totalMovieWatchedRuntime'));
    var watchedMovies = Number(localStorage.getItem('numberWatchedMovies'));

    if(totalMovieWatchedRuntime != null && watchedMovies != null)
    {
      totalMovieWatchedRuntime -= movieruntime;
      watchedMovies -= 1;
    }
    else
    {
      totalMovieWatchedRuntime = 0;
      watchedMovies = 0;
    }

    localStorage.setItem('totalMovieWatchedRuntime', totalMovieWatchedRuntime.toString());
    localStorage.setItem('numberWatchedMovies', watchedMovies.toString());
  }

  getShowGenre(genre: string): number {
      for (const [key, value] of Object.entries(ShowGenre)) {
        if (value === genre)
          return parseInt(key, 10);
      }
      return -1;
  }

  getMovieGenre(genre: string): number {
    for (const [key, value] of Object.entries(MovieGenre)) {
      if (value === genre)
        return parseInt(key, 10);
    }
    return -1;
  }

    // Write to file
    async writeToFile(filename: string, updatedContent: string) {
      await this.createFile(filename);
  
      await Filesystem.writeFile({
        path: filename,
        data: updatedContent,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
    }
  
    // Read from file
    async readFromFile(filename: string): Promise<ReadFileResult> {
      return await Filesystem.readFile({
        path: filename,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
    }
  
    // Create all files
    async createFile(filename: string) {
        await Filesystem.writeFile({
          path: filename,
          data: '',
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
    }

}
