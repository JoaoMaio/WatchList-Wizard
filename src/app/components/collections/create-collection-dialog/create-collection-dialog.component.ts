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
  template: `
    <h2 mat-dialog-title>Create New Collection</h2>
    <mat-dialog-content>
      <mat-form-field>
        <mat-label>Name</mat-label>
        <input matInput [(ngModel)]="name" required>
      </mat-form-field>
      <mat-form-field>
        <mat-label>Description</mat-label>
        <textarea matInput [(ngModel)]="description" rows="3"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="create()" [disabled]="!name">Create</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-form-field {
      width: 100%;
      margin-bottom: 1rem;
    }
    mat-dialog-content {
      min-width: 300px;
    }
  `]
})
export class CreateCollectionDialogComponent {
  name = '';
  description = '';

  constructor(private dialogRef: MatDialogRef<CreateCollectionDialogComponent>) {}

  create(): void {
    if (this.name) {
      this.dialogRef.close({ name: this.name, description: this.description });
    }
  }
} 