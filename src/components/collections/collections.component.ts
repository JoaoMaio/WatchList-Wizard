import { Component, OnInit } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CreateCollectionDialogComponent } from './create-collection-dialog/create-collection-dialog.component';
import { Collection } from '../../utils/collection.model';
import { CollectionsService } from '../../services/collections.service';

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
export class CollectionsComponent implements OnInit {
  collections$: Observable<Collection[]>;

  constructor(
    public collectionsService: CollectionsService,
    private dialog: MatDialog,
  ) {
    this.collections$ = this.collectionsService.collections$.pipe(
      map(collections => collections.sort((a, b) => a.name.localeCompare(b.name)))
    );

    // filter empty collections
    this.collections$ = this.collections$.pipe(
      map(collections => collections.filter(collection => collection.items.length > 0))
    );
  }

  ngOnInit(): void {
  }

  openCreateCollectionDialog(): void {
    const dialogRef = this.dialog.open(CreateCollectionDialogComponent);
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.collectionsService.createCollection(result.name, result.description);
      }
    });
  }

} 