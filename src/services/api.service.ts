import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';


export interface MovieResponse {
    page: number;
    total_results: number;
    total_pages: number;
    results: SimpleMovie[];
}

export interface SimpleMovie {
    id: number;
    original_title: string;
    poster_path: string;
    title: string;
    type: string;
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
    origin_country : string[];
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

export type SimpleTvshow = {
  id: number;
  original_title: string;
  poster_path: string;
  title: string;
  type: string;
}

export type ComplexTvshow = {
  id: number
  adult: boolean
  backdrop_path: string
  first_air_date: string
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
};

export type Episode = {
  id: number
  name: string
  overview: string
  air_date: string
  episode_number: number
  episode_type: string
  runtime: number
  season_number: number
}

export type TvShowResponse = {
  page: number
  results: SimpleTvshow[]
  total_pages: number
  total_results: number
}

export interface Season {
  air_date: string
  episode_count: number
  id: number
  name: string
  overview: string
  poster_path: string
  season_number: number
  vote_average: number
}


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private API_KEY : string = '75ed341317b0320f7fe3d41f435318b6';
  private BASE_API_URL : string = 'https://api.themoviedb.org/3/';
  private MOVIE_API_URL : string = 'https://api.themoviedb.org/3/search/movie?include_adult=true&language=en-US&';
  private IMAGE_PATH : string = 'https://image.tmdb.org/t/p/w500';
  private BACKDROP_IMAGE_PATH : string = 'https://image.tmdb.org/t/p/w780';
  private page = 1;
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI3NWVkMzQxMzE3YjAzMjBmN2ZlM2Q0MWY0MzUzMThiNiIsIm5iZiI6MTcyODY4MjkxMy4xOTYwMDIsInN1YiI6IjY3MDk5YWQ0NTQxNjgwMjI4MWE1ZTFhMyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.5zc5-y6w12GWPHK0KH0iqmW10fgMpsZWbLj9RcNv3Eg"
  });

  buyProviders = ['Apple TV', 'Amazon Video', 'Google Play Movies', 'YouTube', 'Disney Plus'];
  flatrateProviders = ['Netflix', 'Amazon Prime Video', 'Disney Plus', 'Max'];


  constructor(private http: HttpClient) {}

  getMoviesByType(type: string, count = 20): Observable<SimpleMovie[]> {
    return this.http.get<MovieResponse>(`${this.BASE_API_URL}/movie/${type}`, { headers: this.headers }).pipe(
      map((response: MovieResponse) => {
        return response.results.map((movie: any) => {
          const simpleMovie: SimpleMovie = {
            id: movie.id,
            original_title: movie.original_title,
            title: movie.title,
            poster_path: `${this.IMAGE_PATH}${movie.poster_path}`,
            type: "movie",
          };
          return simpleMovie;
        });
      })
    )
  }

  getTrendingMovies(): Observable<SimpleMovie[]> {
    return this.http.get<MovieResponse>(`${this.BASE_API_URL}/trending/movie/week?language=en-US`, { headers: this.headers }).pipe(
      map((response: MovieResponse) => {
        return response.results.map((movie: any) => {
          const simpleMovie: SimpleMovie = {
            id: movie.id,
            original_title: movie.original_title,
            title: movie.title,
            poster_path: `${this.IMAGE_PATH}${movie.poster_path}`,
            type: "movie",
          };
          return simpleMovie;
        });
      })
    )
  }

  async saveMoviesToFile(newMovie: ComplexMovie) {
    try {
      const filename = 'movies.json';
      let currentContentList: ComplexMovie[] = [];
  
      // Check if the file exists
      const fileExists = await this.checkIfFileExists(filename);
  
      if (fileExists) {
        // Read the current contents of the file if it exists
        const file = await Filesystem.readFile({
          path: filename,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
  
        if (file.data) 
        {
          try {
            // Parse the existing file content to a list of ComplexMovie objects
            currentContentList = JSON.parse(file.data as string) as ComplexMovie[];
          } catch (error) {
            console.error('Error parsing existing JSON file:', error);
            throw new Error('Invalid JSON in file.');
          }
        }
      }
  
      // Add the new movie to the list of movies
      currentContentList.push(newMovie);
  
      // Convert the updated movie list to JSON format (pretty print for readability)
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

  async movieExistsById(movieId: number): Promise<boolean> {
    try {
      const filename = 'movies.json';
      const fileExists = await this.checkIfFileExists(filename);
  
      if (!fileExists) {
        console.log('File does not exist.');
        return false;
      }
  
      // Read the current contents of the file
      const file = await Filesystem.readFile({
        path: filename,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
  
      let movieList: ComplexMovie[] = [];
  
      if (file.data) {
        try {
          // Parse the existing file content to a list of ComplexMovie objects
          movieList = JSON.parse(file.data as string) as ComplexMovie[];
        } catch (error) {
          console.error('Error parsing JSON file:', error);
          throw new Error('Invalid JSON in file.');
        }
  
        // Check if a movie with the given ID exists in the list
        const movieExists = movieList.some(movie => movie.id === movieId);
        return movieExists;
      }
      return false;
    } catch (e) {
      console.error('Error checking if movie exists', e);
      return false;
    }
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
  
  //--------------------------------------------------------------------------------//
  //----------------------------  TV SHOWS  ----------------------------------------//

  getTvShowsByType(type: string, count = 20): Observable<SimpleTvshow[]> {
    return this.http
      .get<TvShowResponse>(`${this.BASE_API_URL}/tv/${type}?&language=en-US`, { headers: this.headers }).pipe(
        map((response: TvShowResponse) => {
          return response.results.map((tvshow: any) => {
            const simpleTvShow: SimpleTvshow = {
              id: tvshow.id,
              original_title: tvshow.original_title,
              title: tvshow.title,
              poster_path: `${this.IMAGE_PATH}${tvshow.poster_path}`,
              type: "tvshow",
            };
            return simpleTvShow;
          });
        })
      )
  }

  getTrendingTvShows(): Observable<SimpleTvshow[]> {
    return this.http
      .get<TvShowResponse>(`${this.BASE_API_URL}/trending/tv/week?language=en-US`, { headers: this.headers }).pipe(
        map((response: TvShowResponse) => {
          return response.results.map((tvshow: any) => {
            const simpleTvShow: SimpleTvshow = {
              id: tvshow.id,
              original_title: tvshow.original_title,
              title: tvshow.title,
              poster_path: `${this.IMAGE_PATH}${tvshow.poster_path}`,
              type: "tvshow",
            };
            return simpleTvShow;
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
    
  //get all watch providers from all countries and remove duplicates
  getWatchProviders(object: any): Provider[] {
    try {

      var response : Provider[] = []; 
      let watchProviders = object['watch/providers']?.results;

      if (watchProviders) 
      {
        for (const country in watchProviders) 
        {
          if (watchProviders[country].flatrate) 
          {
            for (const provider of watchProviders[country].flatrate) 
            {
              if (!response.some(p => p.provider_id === provider.provider_id) &&  this.flatrateProviders.includes(provider.provider_name)) 
                response.push(provider);
            }
          }

          if(watchProviders[country].buy)
          {
            for (const provider of watchProviders[country].buy) 
            {
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

  // searchMovies(page: number, searchValue?: string) {
  //   const url = searchValue ? 'search/movie' : 'movie/popular'

  //   return this.http.get<MovieResponse>(
  //     `${this.BASE_API_URL}/${url}?query=${searchValue}&page=${page}&include_adult=true&api_key=${this.apiKey}`
  //   )
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