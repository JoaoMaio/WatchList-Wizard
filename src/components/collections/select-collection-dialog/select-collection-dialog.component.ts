import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Collection } from '../../../utils/collection.model';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-select-collection-dialog',
  templateUrl: './select-collection-dialog.component.html',
  styleUrl: './select-collection-dialog.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    FormsModule
  ]
})
export class SelectCollectionDialogComponent {
  selectedCollectionId: string = '';
  collections$: Observable<Collection[]>;

  constructor(
    public dialogRef: MatDialogRef<SelectCollectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { collections$: Observable<Collection[]>, id: number, type: string }
  ) {

    // only show collections that don't already contain the item
    this.collections$ = data.collections$.pipe(
      map((collections: Collection[]) => collections.filter(collection => !collection.items.some(item => item.id === data.id && item.type === data.type)))
    );

  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close(this.selectedCollectionId);
  }
}
