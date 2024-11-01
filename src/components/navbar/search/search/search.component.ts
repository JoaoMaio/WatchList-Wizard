import { Component } from '@angular/core';
import { ApiService, SimpleObject } from '../../../../services/api.service';
import { FormsModule } from '@angular/forms';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../../environment';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule, CommonModule, NgOptimizedImage, NgOptimizedImage],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent {

  searchType: string = "tv"
  searchTerm: string = ""
  response: SimpleObject[] | SimpleObject [] = []
  imgPath = environment.imgPath;

  constructor( public api: ApiService,
                private router: Router
  ) { }

  ngOnInit() {
  }

  changeSearchType(type: string) {
    this.searchType = type
  }

  setTerm(term: string) {
    this.searchTerm = term
  }

  search() {
    this.api.searchInDatabase(this.searchTerm, 'tv').subscribe({
      next: (response) => {
        this.response = response

        this.api.searchInDatabase(this.searchTerm, 'movie').subscribe({
          next: (response) => {
            this.response.push(...response)

            this.response.sort((a: SimpleObject, b: SimpleObject) => {
              return b.popularity - a.popularity
            })
          },
          error: (error) => {
            console.error('Error fetching search movie results:', error);
          }
        })
      },
      error: (error) => {
        console.error('Error fetching search tv results:', error);
      }
    })

  }

  showInfo(object: SimpleObject) {
      this.router.navigate([`/info/${object.type}`, object.id]);
  }


}
