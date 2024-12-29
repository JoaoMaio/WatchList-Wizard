import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { Collection, DatabaseService } from '../../../services/sqlite.service';

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
  selectedCollectionId: number = 0;
  collections : Collection[] = [];

  constructor(
    private databaseService: DatabaseService,
    public dialogRef: MatDialogRef<SelectCollectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: number, type: string }
    ) {
        // only show collections that don't already have the item in them
        this.databaseService.getCollections().then((collections) => {
          this.collections = collections.filter((collection) => {
            return collection.items.findIndex((item) => item.id === data.id) === -1;
          });
        });
    }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close(this.selectedCollectionId);
  }
}
