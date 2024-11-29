import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-collection-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './create-collection-dialog.component.html',
  styleUrl: '../select-collection-dialog/select-collection-dialog.component.scss'
})
export class CreateCollectionDialogComponent {
  name = '';

  constructor(private dialogRef: MatDialogRef<CreateCollectionDialogComponent>) {}

  create(): void {
    if (this.name) {
      this.dialogRef.close({ name: this.name });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
} 