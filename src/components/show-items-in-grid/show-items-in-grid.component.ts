import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService, GeneralItem } from '../../services/api.service';
import { environment } from '../../environment';

@Component({
  selector: 'app-show-items-in-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './show-items-in-grid.component.html',
  styleUrl: './show-items-in-grid.component.scss'
})
export class ShowItemsInGridComponent {

  @Input() items: GeneralItem[] = [];
  @Input() howManyColumns = 3;

  imgPath = environment.imgPath;
  
  constructor(private router: Router,
              public api: ApiService,
  ) { }


  showInfo(object: GeneralItem) {
    this.router.navigate([`/info/${object.type}`, object.id]);
  }

}
