import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ShowItemsInGridComponent } from "../../show-items-in-grid/show-items-in-grid.component";
import { MatIconModule } from '@angular/material/icon';
import { AddItemsCollectionComponent } from '../add-items-collection/add-items-collection.component';
import { CommonModule } from '@angular/common';
import { Collection, DatabaseService } from '../../../services/sqlite.service';

@Component({
  selector: 'app-collection-items',
  standalone: true,
  imports: [ShowItemsInGridComponent, MatIconModule, AddItemsCollectionComponent, CommonModule],
  templateUrl: './collection-items.component.html',
  styleUrl: './collection-items.component.scss'
})
export class CollectionItemsComponent implements OnInit {

  showAddItems: boolean = false;
  isLoading: boolean = true;
  collection: Collection = {id: 0, name: '', items: []}; 
  

  constructor(private route: ActivatedRoute,
              private databaseService: DatabaseService,
        ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.isLoading  = true;
      this.databaseService.getCollection(params['id']).then((collection) => {
        this.collection = collection;
        this.isLoading = false;
      });
    });
  }

  // go to the previous page
  goBack(){
    window.history.back();
  }

  toggleAddItems() {
      this.showAddItems = !this.showAddItems;
      this.databaseService.getCollection(this.collection.id).then((collection) => {
        this.collection = collection;
      });
  }

}
