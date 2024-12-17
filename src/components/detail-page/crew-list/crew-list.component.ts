import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ApiService, SimpleCharacter } from '../../../services/api.service';
import { environment } from '../../../environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-crew-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './crew-list.component.html',
  styleUrl: './crew-list.component.scss'
})
export class CrewListComponent {

  @Input() crew: SimpleCharacter[] = [];

  imgPath: string = environment.imgPath;

  constructor(public api: ApiService,
              private router: Router
  ) { }

  goToPersonPage(personId: number) {
      this.router.navigate([`/info/person`, personId]);
  }

}
