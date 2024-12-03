import { Component } from '@angular/core';
import { ApiService, SimpleObject } from '../../../../services/api.service';
import { FormsModule } from '@angular/forms';
import {CommonModule} from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../../environment';
import { ShowItemsInGridComponent } from "../../../show-items-in-grid/show-items-in-grid.component";
import { GeneralItem } from '../../../../utils/collection.model';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule, CommonModule, ShowItemsInGridComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent {

  searchType: string = "tv"
  searchTerm: string = ""
  isLoading: boolean = false
  response: SimpleObject[] = []
  responseGeneralItems: GeneralItem[] = []
  imgPath = environment.imgPath;
  page = 1;
  totalPages = 0;

  constructor( public api: ApiService,
                private router: Router
  ) { }

  ngOnInit() {
    this.resetSearch()  
    this.searchTerm = localStorage.getItem('searchTerm') || ''
    if (this.searchTerm !== '')
      this.search()
  }

  changeSearchType(type: string) {
    this.searchType = type
  }

  resetSearch() {
    this.searchTerm = ''
    this.response = []
    this.page = 1
  }

  search() {
    this.isLoading = true;
    this.response = []
    this.page = 1

    localStorage.setItem('searchTerm', this.searchTerm);    // save search term to local storage

    const fetchPage = (page: number) => {
      return new Promise<void>((resolve, reject) => {
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
      });
    };

    const fetchAllPages = async () => {
      try {
      await fetchPage(this.page);
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
