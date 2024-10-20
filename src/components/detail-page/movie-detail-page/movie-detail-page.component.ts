import { Component, OnInit } from '@angular/core';
import { ApiService, ComplexMovie } from '../../../services/api.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-movie-detail-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './movie-detail-page.component.html',
  styleUrl: './movie-detail-page.component.scss'
})
export class MovieDetailPageComponent implements OnInit {

  movie: ComplexMovie | undefined;
  isLoading: boolean = true;
  watched: boolean = false;

  constructor(private api: ApiService,
              private route: ActivatedRoute,
  ) { }
  
  ngOnInit(): void {
    
    this.route.params.subscribe(params => {
      this.isLoading  = true;
      this.api.getMovieById(params['id']).subscribe({
        next: (response: ComplexMovie) => {
          this.movie = response;
          this.api.movieExistsById(this.movie.id).then(exists => {
            this.watched = exists;
          });
        },
        complete: () => {
         this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching movies:', error);
      }});
    });

    
  }

  markAsWatched() {
    const alreadyMarked = this.watched;
    this.watched = !this.watched;

    if (alreadyMarked) 
    {
      //TODO - remove movie from the json file
      return;
    }
    else 
      this.saveMovie();
  }

  //Function to save the movie to the json file
  async saveMovie() {
    var res = await this.api.movieExistsById(this.movie!.id);

    if (res) 
    {
      console.log('Movie already exists');
      return;
    }


    await this.api.saveMoviesToFile(this.movie!);
  }


}
