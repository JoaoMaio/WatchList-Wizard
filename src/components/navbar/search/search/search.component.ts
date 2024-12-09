import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ApiService, SimpleObject, SimplePerson } from '../../../../services/api.service';
import { FormsModule } from '@angular/forms';
import {CommonModule} from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../../environment';
import { ShowItemsInGridComponent } from "../../../show-items-in-grid/show-items-in-grid.component";
import { GeneralItem } from '../../../../utils/collection.model';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule, CommonModule, ShowItemsInGridComponent, MatIconModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent implements OnInit {

  searchTerm: string = ""
  selectedFilter: string = 'all';
  isLoading: boolean = false
  response: SimpleObject[] = []
  responsePerson: SimplePerson[] = []
  imgPath = environment.imgPath;
  page = 1;
  totalPages = 0;
  searched = false;

  constructor( public api: ApiService,
                private router: Router
  ) { }

  ngOnInit() {
    this.resetSearch()  
    this.searchTerm = localStorage.getItem('searchTerm') || ''
    this.selectedFilter = localStorage.getItem('selectedFilter') || 'all'
    if (this.searchTerm !== '')
      this.search()
  }

  onSearchTermChange(searchTerm: string) {
      if (searchTerm == '' && this.response.length == 0) {
        this.resetSearch()
      }
  }

  resetSearch() {
    //this.searchTerm = ''
    this.response = []
    this.responsePerson = []
    this.page = 1
    this.searched = false
  }

  search() {  
    this.isLoading = true;
    this.resetSearch()

    localStorage.setItem('searchTerm', this.searchTerm);    // save search term to local storage
    localStorage.setItem('selectedFilter', this.selectedFilter);    // save search type to local storage

    const fetchPage = (page: number) => {
      return new Promise<void>((resolve, reject) => {

        if (this.selectedFilter === 'all') {
          this.api.searchInDatabaseMulti(this.searchTerm, page).subscribe({
            next: (response) => {
            this.response = this.response.concat(response[0]);
            this.totalPages = response[1];
            this.response.sort((a: SimpleObject, b: SimpleObject) => {
              return b.popularity - a.popularity;
            });
            resolve();
            },
            error: (error) => {
              console.error('Error fetching results:', error);
            reject(error);
            }
          });
        } 
        
        if (this.selectedFilter === 'movies') {
          this.api.searchInDatabase(this.searchTerm, "movie", page).subscribe({
            next: (response) => {
            this.response = this.response.concat(response[0]);
            this.totalPages = response[1];
            this.response.sort((a: SimpleObject, b: SimpleObject) => {
              return b.popularity - a.popularity;
            });
            resolve();
            },
            error: (error) => {
              console.error('Error fetching results:', error);
            reject(error);
            }
          });
        }

        if (this.selectedFilter === 'shows') {
          this.api.searchInDatabase(this.searchTerm, "tv", page).subscribe({
            next: (response) => {
            this.response = this.response.concat(response[0]);
            this.totalPages = response[1];
            this.response.sort((a: SimpleObject, b: SimpleObject) => {
              return b.popularity - a.popularity;
            });
            resolve();
            },
            error: (error) => {
              console.error('Error fetching results:', error);
            reject(error);
            }
          });
        }

        if (this.selectedFilter === 'person') {
          this.api.searchPeople(this.searchTerm, page).subscribe({
            next: (response) => {
              this.responsePerson = this.responsePerson.concat(response[0]);
              this.totalPages = response[1];
              this.responsePerson.sort((a: SimplePerson, b: SimplePerson) => {
                return b.popularity - a.popularity;
              });
              resolve();
            },
            error: (error) => {
              console.error('Error fetching results:', error);
            reject(error);
            }
          });
        }

      });
    };

    const fetchAllPages = async () => {
      try {
      this.searched = true;
      await fetchPage(this.page);
      if (this.page >= this.totalPages) {
        return;
      }

      await fetchPage(this.page + 1);
      await fetchPage(this.page + 2);
      this.page += 2;
      } catch (error) {
      console.error('Error fetching all pages:', error);
      }
    };

    fetchAllPages();
  }

  incrementPage() {
    this.page++;
    this.api.searchInDatabaseMulti(this.searchTerm, this.page).subscribe({
      next: (response) => {
        this.response = this.response.concat(response[0]);
        this.totalPages = response[1];
      }
    });
  }

  showInfo(object: SimpleObject) {
      this.router.navigate([`/info/${object.type}`, object.id]);
  }


}
