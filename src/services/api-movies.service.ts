import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from '../environment';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {ApiService, EmptySimpleObject, Genre, SimpleObject, Spoken_Languages} from './api.service';
import {Provider} from './api-shows.service';

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

export const MovieStatus = {
  0: 'Rumored',
  1: 'Planned',
  2: 'In Production',
  3: 'Post Production',
  4: 'Released',
  5: 'Canceled'
}


@Injectable({
  providedIn: 'root'
})
export class ApiMoviesService {

  private BASE_API_URL: string = environment.BASE_API_URL;
  private headers = new HttpHeaders(environment.headers);
  movies_filename = 'movies.json';


  constructor(private http: HttpClient,
              private generalApi: ApiService) {}

  //-------------------------------------------------------------------------------------//
  //----------------------------   MOVIES  GETS  ----------------------------------------//
  //-------------------------------------------------------------------------------------//

  getMoviesByType(type: string, page = 1): Observable<SimpleObject[]> {
    return this.http.get<MovieResponse>(`${this.BASE_API_URL}movie/${type}?language=en-US&page=${page}`, { headers: this.headers }).pipe(
      map((response: MovieResponse) => {
        return response.results
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
      })
    )
  }

  getTrendingMovies(): Observable<SimpleObject[]> {
    return this.http.get<MovieResponse>(`${this.BASE_API_URL}/trending/movie/week?language=en-US`, { headers: this.headers }).pipe(
      map((response: MovieResponse) => {
        return response.results
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
      })
    )
  }

  getMovieById(id: string): Observable<ComplexMovie> {
    return this.http.get<ComplexMovie>(`${this.BASE_API_URL}/movie/${id}?append_to_response=watch/providers`, { headers: this.headers }).pipe(
      map((movie: any) => {
        let watchProvidersR = this.generalApi.getWatchProviders(movie)
        return {
          ...movie,
          watch_providers: watchProvidersR
        };
      })
    )
  }

  getSimilarMovies(id: string): Observable<SimpleObject[]> {
    return this.http.get<MovieResponse>(`${this.BASE_API_URL}/movie/${id}/similar?language=en-US`, { headers: this.headers }).pipe(
      map((response: MovieResponse) => {
        return response.results
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
      })
    )
  }

  getTopRatedMovies(): Observable<SimpleObject[]> {
    return this.http.get<MovieResponse>(`${this.BASE_API_URL}/movie/top_rated?language=en-US`, { headers: this.headers }).pipe(
      map((response: MovieResponse) => {
        return response.results
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
      })
    )
  }

  //-------------------------------------------------------------------------------------//
  //----------------------------   MOVIES  FILE  ----------------------------------------//
  //-------------------------------------------------------------------------------------//

  getMovieStatus(status: string): number {
      for (const [key, value] of Object.entries(MovieStatus)) {
        if (value === status)
          return parseInt(key, 10);
      }
      return -1;
  }

  async saveMoviesToFile(newMovie: ComplexMovie, timesWatched: number) {
    try {

      if (!await this.generalApi.checkIfFileExists(this.movies_filename)) {
        return;
      }

      let currentContentList: SimpleObject[] = [];

      await this.generalApi.readFromFile(this.movies_filename).then(async (data) => {
        let file = data;
        if (file.data) {
          try {
            currentContentList = JSON.parse(file.data as string) as SimpleObject[];
          } catch (error) {
            console.error('Error parsing existing JSON file:', error);
          }
        }

        // check if movie already in the list
        let objectIndex = currentContentList.findIndex(s => s.id === newMovie.id);

        //if movie already in the list, update the times watched
        if (objectIndex > -1) {
          currentContentList[objectIndex].timesWatched = timesWatched;
          const updatedContent = JSON.stringify(currentContentList, null, 2);
          await this.generalApi.writeToFile(this.movies_filename, updatedContent);
          return
        }

        const SimpleObject: SimpleObject = {
          id: newMovie.id,
          original_title: newMovie.original_title,
          title: newMovie.title,
          poster_path: newMovie.poster_path,
          type: "movie",
          popularity: newMovie.popularity,
          runtime: newMovie.runtime,
          timesWatched: timesWatched,
          status: this.getMovieStatus(newMovie.status)
        };

        currentContentList.push(SimpleObject);
        const updatedContent = JSON.stringify(currentContentList, null, 2);
        await this.generalApi.writeToFile(this.movies_filename, updatedContent);
      });

    } catch (e) {
      console.error('Unable to write file', e);
    }
  }

  async movieExistsById(movieId: number): Promise<SimpleObject> {
    try {

      if (!await this.generalApi.checkIfFileExists(this.movies_filename)) {
        return EmptySimpleObject;
      }

      let movieList: SimpleObject[] = [];

      return await this.generalApi.readFromFile(this.movies_filename).then((data) => {
        let file = data;

        if (file.data) {
          try {

            movieList = JSON.parse(file.data as string) as SimpleObject[];
          } catch (error) {
            console.error('Error parsing JSON file:', error);
          }

          //get the object from the list
          if (movieList.length > 0)
          {
            let objectIndex = movieList.findIndex(s => s.id === movieId);
            if (objectIndex === -1) return EmptySimpleObject;

            return movieList[objectIndex];
          }
          return EmptySimpleObject;
        }
        return EmptySimpleObject;
      });

    } catch (e) {
      console.error('Error checking if movie exists', e);
      return EmptySimpleObject;
    }
  }

  async getAllMoviesFromFile(): Promise<SimpleObject[]> {
    try {

      if (!await this.generalApi.checkIfFileExists(this.movies_filename)) {
        return [];
      }

      let movieList: SimpleObject[] = [];

      return await this.generalApi.readFromFile(this.movies_filename).then((data) => {
        let file = data;
        if (file.data)
        {
          try {

            movieList = JSON.parse(file.data as string) as SimpleObject[];
          } catch (error) {
            console.error('Error parsing JSON file:', error);
          }
        }

        return movieList;
      });

    } catch (e) {
      console.error('Error checking if movie exists', e);
      return [];
    }
  }

  async getLastWatchedMovie(): Promise<SimpleObject> {
    try {

      if (!await this.generalApi.checkIfFileExists(this.movies_filename)) {
        return EmptySimpleObject;
      }

      let movieList: SimpleObject[] = [];

      return await this.generalApi.readFromFile(this.movies_filename).then((data) => {
        let file = data;
        if (file.data)
        {
          try {

            movieList = JSON.parse(file.data as string) as SimpleObject[];
          } catch (error) {
            console.error('Error parsing JSON file:', error);
          }
        }

        if (movieList.length > 0)
        {
          //invert the list order
          movieList = movieList.reverse();

          //get the first movie that timesWatched > 0
          let objectIndex = movieList.findIndex(s => s.timesWatched > 0);
          if (objectIndex === -1) return EmptySimpleObject;

          return movieList[objectIndex];

        }

        return EmptySimpleObject;
      });

    } catch (e) {
      console.error('Error checking if movie exists', e);
      return EmptySimpleObject;
    }

  }

}
