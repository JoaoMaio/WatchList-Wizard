import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CollectionsService } from '../../../services/collections.service';
import { Collection } from '../../../utils/collection.model';
import { ShowItemsInGridComponent } from "../../show-items-in-grid/show-items-in-grid.component";
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-collection-items',
  standalone: true,
  imports: [ShowItemsInGridComponent, MatIconModule],
  templateUrl: './collection-items.component.html',
  styleUrl: './collection-items.component.scss'
})
export class CollectionItemsComponent implements OnInit {

  isLoading: boolean = true;
  collection: Collection = {id: '', name: '', items: [], created_at: '', updated_at: ''}; 

  constructor(private route: ActivatedRoute,
            private collectionsService: CollectionsService
        ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.isLoading  = true;

      this.collectionsService.collections$.subscribe((collections) => {
          this.collection = collections.find(collection => collection.id === params['id']) || this.collection;
      });

    });
  }

  // go to the previous page
  goBack(){
    window.history.back();
  }

}
