import { Component, OnInit } from '@angular/core';
import { ApiService, SimpleObject } from '../../../services/api.service';
import { Router } from '@angular/router';
import {CommonModule, NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-show-list',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, NgOptimizedImage],
  templateUrl: './show-list.component.html',
  styleUrl: './show-list.component.scss'
})
export class ShowListComponent implements OnInit {


  constructor(public api: ApiService,
    private router: Router
  ) { }

  allObjects: SimpleObject[] = []

  ngOnInit() {

    // this.api.getAllShows().then((response) => {
    //   this.allObjects.push(...response)
    // })

  }

  showInfo(object: SimpleObject) {
    this.router.navigate([`/info/${object.type}`, object.id]);
  }

}
