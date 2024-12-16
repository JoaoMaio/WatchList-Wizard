import { Component, Input } from '@angular/core';
import { ApiMoviesService } from '../../../services/api-movies.service';
import { ApiShowsService } from '../../../services/api-shows.service';
import { ApiService, SimpleObject } from '../../../services/api.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CollectionsService } from '../../../services/collections.service';
import { GeneralItem } from '../../../utils/collection.model';
import { environment } from '../../../environment';
import { MatIconModule } from '@angular/material/icon';


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
  addedItems: GeneralItem[] = [];

  imgPath = environment.imgPath;

  @Input() collectionId: string = '';

  constructor(public movies_api: ApiMoviesService,
    public shows_api: ApiShowsService,
    public api: ApiService,
    private router: Router,
    private collectionsService: CollectionsService,
  ) { }

  async ngOnInit() {
    this.isLoading = true;

    //Get all shows and movies
    this.api.getFromFile(0, 'tv').then((response) => {
      this.Shows.push(...response)
      this.items = this.Shows.map(show => ({ item: show, added: false }));

      if (this.collectionId) 
      {
        this.collectionsService.collections$.subscribe((collections) => {
          const collection = collections.find((collection) => collection.id === this.collectionId);
          if (collection) 
            this.addedItems = collection.items;
        });
        this.checkForAddedItems();
      }
      this.sortItems();
    })

    this.api.getFromFile(0, 'movie').then((response) => {
      this.Movies.push(...response)
      this.isLoading = false;
    })
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

      // if item id is already in the collection, remove it 
      const addedItem = this.addedItems.find((addedItem) => addedItem.id === item.id);

      if (addedItem)
      {
        await this.collectionsService.removeFromCollection(this.collectionId, item.id);
      }
      else
      {
        if (this.collectionId) 
          {
            const GeneralItem: GeneralItem = {
              id: item.id,
              type: item.type,
              title: item.title ? item.title : item.original_title,
              poster_path: item.poster_path,
            };
            
            this.collectionsService.addToCollection(this.collectionId, GeneralItem);
          }
      }

      this.checkForAddedItems();
  }
}