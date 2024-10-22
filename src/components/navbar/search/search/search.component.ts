import { Component } from '@angular/core';
import { ApiService, SimpleObject } from '../../../../services/api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent {

  searchType: string = "tv"
  searchTerm: string = ""
  response: SimpleObject[] | SimpleObject [] = []

  constructor( private api: ApiService,
                private router: Router
  ) { }

  ngOnInit() {
  }

  changeSearchType(type: string) {
    console.log('Search type changed to:', type)
    this.searchType = type
  }

  setTerm(term: string) {
    console.log('Search term changed to:', term)
    this.searchTerm = term
  }

  search() {
    this.api.search(this.searchTerm, this.searchType).subscribe({
      next: (response) => {
        this.response = response  

        //order by popularity
        this.response.sort((a: SimpleObject, b: SimpleObject) => {
          return b.popularity - a.popularity
        })
      },
      error: (error) => {
        console.error('Error fetching search results:', error);
      }
    })

  }

  showInfo(object: SimpleObject) {
      this.router.navigate([`/info/${object.type}`, object.id]); 
  } 
  

}
