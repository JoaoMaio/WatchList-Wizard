import { Component } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CreateCollectionDialogComponent } from './create-collection-dialog/create-collection-dialog.component';
import { Collection } from '../../utils/collection.model';
import { CollectionsService } from '../../services/collections.service';
import { Router } from '@angular/router';

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
  collections$: Observable<Collection[]>;

  constructor(
    public collectionsService: CollectionsService,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.collections$ = this.collectionsService.collections$.pipe(
      map(collections => collections.sort((a, b) => a.name.localeCompare(b.name)))
    );

    // // filter empty collections
    // this.collections$ = this.collections$.pipe(
    //   map(collections => collections.filter(collection => collection.items.length > 0))
    // );
  }

  goToCollection(collection: Collection){
    this.router.navigate(['/collection', collection.id]);
  }

  openCreateCollectionDialog(): void {
    const dialogRef = this.dialog.open(CreateCollectionDialogComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.collectionsService.createCollection(result.name);
      }
    });


  }

}
