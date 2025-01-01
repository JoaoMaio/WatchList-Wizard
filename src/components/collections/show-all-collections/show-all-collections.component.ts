import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CreateCollectionDialogComponent } from '../create-collection-dialog/create-collection-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DeleteCollectionDialogComponent } from '../delete-collection-dialog/delete-collection-dialog.component';
import { Collection, DatabaseService } from '../../../services/sqlite.service';

@Component({
  selector: 'app-show-all-collections',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './show-all-collections.component.html',
  styleUrl: './show-all-collections.component.scss'
})
export class ShowAllCollectionsComponent {

  collections: Collection[] = [];

  constructor(private router: Router,
              private dialog: MatDialog,
              private databaseService: DatabaseService
            ) 
  {
    this.databaseService.getCollections().then((collections) => {
      this.collections = collections;
    });
  }

  goToCollection(collection: Collection){
    this.router.navigate(['/collection', collection.id]);
  }

  openCreateCollectionDialog(): void {
    const dialogRef = this.dialog.open(CreateCollectionDialogComponent);
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) 
            this.databaseService.addCollection(result.name);
    
          this.databaseService.getCollections().then((collections) => {
            this.collections = collections;
          });
        });
    };
  
  deleteCollection(collection: Collection){

    const dialogRef = this.dialog.open(DeleteCollectionDialogComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result) 
        this.databaseService.deleteCollection(collection.id);
    });
  }

  goBack(){
    window.history.back();
  }

}
