import { Component, OnInit } from '@angular/core';
import { SimpleObject } from '../../services/api.service';
import { DatabaseService } from '../../services/sqlite.service';

@Component({
  selector: 'app-random',
  standalone: true,
  imports: [],
  templateUrl: './random.component.html',
  styleUrl: './random.component.scss'
})
export class RandomComponent implements OnInit {

    allShows: SimpleObject[] = []
    allMovies: SimpleObject[] = []

  constructor(
    private databaseService: DatabaseService,
  ) { }

  ngOnInit() {

    this.databaseService.getMovies().then((response) => {
      response.forEach((movie) => {
        if(movie.timesWatched > 0) 
          return;

        this.allMovies.push({
          id: movie.id,
          original_title: movie.original_title,
          title: movie.original_title,
          poster_path: movie.poster_path,
          type: "movie",
          popularity: 0,
          timesWatched: movie.timesWatched,
          status: movie.status
        });
      });

      console.log(this.allMovies);
    })

    this.databaseService.getShows().then((response) => {
      response.forEach((show) => {
        if( (show.timesWatched == 0 && (show.status == 0 || show.status == 3 || show.status == 4)) || show.timesWatched == -1)
        {
          this.allShows.push({
            id: show.id,
            original_title: show.original_title,
            title: show.original_title,
            poster_path: show.poster_path,
            type: "tvshow",
            popularity: 0,
            timesWatched: show.timesWatched,
            status: show.status
          });
        }
      });

      console.log(this.allShows);
    });
  }


  getRandomMovie() {
    const randomIndex = Math.floor(Math.random() * this.allMovies.length);
    return this.allMovies[randomIndex];
  }

  getRandomShow() {
    const randomIndex = Math.floor(Math.random() * this.allShows.length);
    return this.allShows[randomIndex];
  }

}
