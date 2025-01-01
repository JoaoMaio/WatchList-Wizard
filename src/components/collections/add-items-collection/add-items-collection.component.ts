import { Component, Input } from '@angular/core';
import { ApiMoviesService } from '../../../services/api-movies.service';
import { ApiShowsService } from '../../../services/api-shows.service';
import { ApiService, SimpleObject } from '../../../services/api.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environment';
import { MatIconModule } from '@angular/material/icon';
import { DatabaseService, SimpleCollectionItem } from '../../../services/sqlite.service';


interface ItemList {
  item : SimpleObject;
  added : boolean;
}

@Component({
  selector: 'app-add-items-collection',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './add-items-collection.component.html',
  styleUrl: './add-items-collection.component.scss'
})
export class AddItemsCollectionComponent {

  isLoading: boolean = false;
  Shows: SimpleObject[] = []
  Movies: SimpleObject[] = []
  selectedView: string = 'tvshow'; 
  items: ItemList[] = []; 
  addedItems: SimpleCollectionItem[] = [];

  imgPath = environment.imgPath;

  @Input() collectionId: number = -1;

  constructor(public movies_api: ApiMoviesService,
    public shows_api: ApiShowsService,
    public api: ApiService,
    private router: Router,
     private databaseService: DatabaseService
  ) { }

  async ngOnInit() {
    this.isLoading = true;

    //Get all shows and movies
    this.databaseService.getShows().then((response) => {
      response.forEach((show) => {
        this.Shows.push({
          id: show.id,
          original_title: show.original_title,
          title: show.original_title,
          poster_path: show.poster_path,
          type: "tvshow",
          popularity: 0,
          timesWatched: show.timesWatched
        });
      });

      this.items = this.Shows.map(show => ({ item: show, added: false }));

      if (this.collectionId) 
        this.getItems();

      this.sortItems();
    })

    this.databaseService.getMovies().then((response) => {
      response.forEach((movie) => {
        this.Movies.push({
          id: movie.id,
          original_title: movie.original_title,
          title: movie.original_title,
          poster_path: movie.poster_path,
          type: "movie",
          popularity: 0,
          timesWatched: movie.timesWatched
        });
      });
      this.isLoading = false;
    })
  }

  getItems(){
    this.databaseService.getCollectionItems(this.collectionId).then((items) => {
      this.addedItems = items;
      this.checkForAddedItems();
    });
  }


  sortItems(){
      // order the items, showing the added items first
      this.items.sort((a, b) => {
        if (a.added && !b.added) return -1;
        if (!a.added && b.added) return 1;
        return 0;
      });
  }

  checkForAddedItems(){
    this.items = this.items.map((item) => {
      if (this.addedItems.find((addedItem) => addedItem.id === item.item.id)) 
        return { item: item.item, added: true };
      else 
        return { item: item.item, added: false };
    });
  }

  showInfo(object: SimpleObject) {
    this.router.navigate([`/info/${object.type}`, object.id]);
  }

  toggleView(value: string) {
    this.selectedView = value;
    if (value === 'tvshow') 
      this.items = this.Shows.map(show => ({ item: show, added: false }));
    else 
      this.items = this.Movies.map(movie => ({ item: movie, added: false }));  
    
    this.checkForAddedItems();
    this.sortItems();
}

  async addOrRemoveFromCollection(item: SimpleObject) {

      const addedItem = this.addedItems.find((addedItem) => addedItem.id === item.id);

      if (addedItem)
      {
        this.databaseService.deleteCollectionItem(this.collectionId, item.id);
        this.getItems();
      }
      else
      {
        if (this.collectionId) {
          this.databaseService.addCollectionItem(this.collectionId, item.id, item.type, item.title, item.poster_path);
          this.getItems();
        }
      }
      this.checkForAddedItems();
  }
}