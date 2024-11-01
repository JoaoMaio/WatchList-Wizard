import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';


@Component({
  selector: 'app-loading-container',
  standalone: true,
  templateUrl: './loading-container.component.html',
  imports: [CommonModule],
})
export class LoadingContainerComponent  {

  @Input() isLoading: boolean = false;

  constructor() {}

}
