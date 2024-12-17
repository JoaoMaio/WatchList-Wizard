import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Directory, Encoding, Filesystem, ReadFileResult} from '@capacitor/filesystem';
import {environment} from '../environment';
import {ComplexMovie, MovieResponse} from './api-movies.service';
import {ComplexTvshow, Episode, Provider, Season, TvShowResponse} from './api-shows.service';

export interface SimpleObject {
  id: number;
  original_title: string;
  poster_path: string;
  title: string;
  type: string;
  popularity: number;
  runtime?: number;
  timesWatched: number;
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

  // Check if the file exists
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
    if (object.character.includes('Self') || 
        object.character.includes('self') || 
        object.character.includes('Himself') || 
        object.character.includes('himself') || 
        object.character.includes('Herself') ||
        object.character.includes('herself')
      ) return false;

    return true;
  }

  isValidMovieCharacter(object: any): boolean {
    // Check if  has a poster, a title, an original title and a character
    if (!object.poster_path || !object.title || !object.original_title) return false;

    return true
  }

  getPersonKnownFor(id: number): Observable<[Credits[], Credits[]]> {
    return this.http.get(`${this.BASE_API_URL}person/${id}/combined_credits`, { headers: this.headers }).pipe(
      map((response: any) => {
      var itemsCast = response.cast
        .filter((object: any) => {
            if (object.media_type === 'tv') 
              return this.isValidTvCharacter(object);
            else if (object.media_type === 'movie') 
              return this.isValidMovieCharacter(object);
        return false;
        })
        .map((object: any) => {
          var SimpleObject: SimpleObject = {
            id: object.id,
            original_title: object.original_name,
            title:  object.name,
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

      var itemsCrew = response.crew
        .filter((object: any) => {
          if (object.media_type === 'tv') 
            return this.isValidTvCharacter(object);
          else if (object.media_type === 'movie') 
            return this.isValidMovieCharacter(object);
        return false;
        })
        .map((object: any) => {
          var SimpleObject: SimpleObject = {
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

  // Remove object (show or movie) from file
  async removeFromFile(objectId: number, type: string) {
    try {
      let filename;

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
          }
        }
      }

      //get the object from the list
      let objectIndex = currentContentList.findIndex(s => s.id === objectId);
      if (objectIndex === -1) return;

      //remove the object from the list
      currentContentList.splice(objectIndex, 1);
      const updatedContent = JSON.stringify(currentContentList, null, 2);

      await Filesystem.writeFile({
        path: filename,
        data: updatedContent,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
    }
    catch (e) {
      console.error('Error checking if object exists', e);
    }
  }

  // Get X quantity of Shows or Movies from file
  async getFromFile(quantity: number = 0, type: string): Promise<SimpleObject[]> {
    try {

      let filename ;

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

      let objectList: SimpleObject[] = [];

      if (file.data)
      {
        try {
          objectList = JSON.parse(file.data as string);
        } catch (error) {
          console.error('Error parsing JSON file:', error);
        }

        if (quantity > 0)
        {
          if (objectList.length-quantity-1 < 0)
            return objectList;

          objectList = objectList.slice(objectList.length-quantity, objectList.length);
          return objectList;
        }
        else
          return objectList;
      }

      return [];
    } catch (e) {
      console.error('Error checking if movie exists', e);
      return [];
    }
  }

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

  // Write to file
  async writeToFile(filename: string, updatedContent: string) {
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
  async createAllFiles() 
  {
    if(!await this.checkIfFileExists('movies.json')) {
      await Filesystem.writeFile({
        path: 'movies.json',
        data: '',
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
    }

    if(!await this.checkIfFileExists('shows.json')) {
      await Filesystem.writeFile({
        path: 'shows.json',
        data: '',
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
    }

    if(!await this.checkIfFileExists('episodes.json')) {
      await Filesystem.writeFile({
        path: 'episodes.json',
        data: '',
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
    }

    if(!await this.checkIfFileExists('collections.json')) {
      await Filesystem.writeFile({
        path: 'collections.json',
        data: '',
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
    }

  }

}
