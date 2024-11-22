import { Component } from '@angular/core';
import { CollectionsService } from '../../../services/collections.service';
import { Collection } from '../../../utils/collection.model';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CreateCollectionDialogComponent } from '../create-collection-dialog/create-collection-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-show-all-collections',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './show-all-collections.component.html',
  styleUrl: './show-all-collections.component.scss'
})
export class ShowAllCollectionsComponent {

  collections: Collection[] = []; 

  constructor(private collectionsService: CollectionsService,
              private router: Router,
              private dialog: MatDialog,
            ) {
    this.collectionsService.collections$.subscribe((collections) => {
      this.collections = collections;
    });
  }


  goToCollection(collection: Collection){
    this.router.navigate(['/collection', collection.id]);
  }

  openCreateCollectionDialog(): void {
    const dialogRef = this.dialog.open(CreateCollectionDialogComponent);
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.collectionsService.createCollection(result.name, result.description);
      }
    });
  }

  // go to the previous page
  goBack(){
    window.history.back();
  }

}
