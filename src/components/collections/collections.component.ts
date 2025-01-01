import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CreateCollectionDialogComponent } from './create-collection-dialog/create-collection-dialog.component';
import { Router } from '@angular/router';
import { Collection, DatabaseService } from '../../services/sqlite.service';

@Component({
  selector: 'app-collections',
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
  ]
})
export class CollectionsComponent {

  collections : Collection[] = [];

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private databaseService: DatabaseService) 
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
  }
}