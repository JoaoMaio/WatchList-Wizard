import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-custom-toastr',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-toastr.component.html',
  styleUrl: './custom-toastr.component.scss',
  animations: [
    trigger('fadeInOut',[
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition(':enter', [style({opacity: 0}), animate('2s ease-in')]),
      transition('visible => hidden', animate('2s ease-out', style({opacity: 0}))),
      ]),
    ]
})
export class CustomToastrComponent {

  @Input() message: string = '';
  @Input() bgColor: string = '';
  @Output() animationStateChange = new EventEmitter<void>();

  animationState: 'visible' | 'hidden' = 'visible';

  constructor() { }
  
  hideToastr() {
    this.animationState = 'hidden';
  }

  onAnimationEnd() {
    // Emit event when the animation is finished
    if (this.animationState === 'hidden') {
      this.animationStateChange.emit();
    }
  }

}
