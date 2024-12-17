import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-delete-collection-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './delete-collection-dialog.component.html',
  styleUrl: '../select-collection-dialog/select-collection-dialog.component.scss'
})
export class DeleteCollectionDialogComponent {
  constructor(private dialogRef: MatDialogRef<DeleteCollectionDialogComponent>) {}

  delete(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
} 