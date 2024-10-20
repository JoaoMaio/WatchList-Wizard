import { Component } from '@angular/core';
import { HomeComponentComponent } from '../components/home/home-component.component';
import { RouterModule } from '@angular/router';
import { NavBarComponent } from "../components/navbar/nav-bar/nav-bar.component";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true,
  imports: [HomeComponentComponent, RouterModule, NavBarComponent],
})

export class AppComponent {
  title = 'TMDBApp';
}
