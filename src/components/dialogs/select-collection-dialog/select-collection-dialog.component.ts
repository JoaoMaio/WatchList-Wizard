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

@Component({
  selector: 'app-select-collection-dialog',
  template: `
    <h2 mat-dialog-title>Add to Collection</h2>
    <mat-dialog-content>
      <mat-form-field appearance="fill" style="width: 100%">
        <mat-label>Select Collection</mat-label>
        <mat-select [(ngModel)]="selectedCollectionId">
          <mat-option *ngFor="let collection of collections$ | async" [value]="collection.id">
            {{collection.name}}
          </mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-button color="primary" [disabled]="!selectedCollectionId" (click)="onConfirm()">Add</button>
    </mat-dialog-actions>
  `,
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
    @Inject(MAT_DIALOG_DATA) public data: { collections$: Observable<Collection[]> }
  ) {
    this.collections$ = data.collections$;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close(this.selectedCollectionId);
  }
}
