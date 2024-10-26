import { Component, OnInit } from '@angular/core';
import { HomeComponentComponent } from '../components/home/home-component.component';
import { RouterModule } from '@angular/router';
import { NavBarComponent } from "../components/navbar/nav-bar/nav-bar.component";
import { App } from '@capacitor/app';
import { CacheDateService } from '../services/cache.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true,
  imports: [HomeComponentComponent, RouterModule, NavBarComponent],
})

export class AppComponent implements OnInit {
  title = 'TMDBApp';

  constructor(private cacheDateService: CacheDateService) {}

  ngOnInit() {
    this.setupBackButtonListener();
    this.cacheDateService.checkAndClearCache();
  }

  setupBackButtonListener() {
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) 
        window.history.back();
      else 
        this.showExitConfirmation();
    });
  }

  showExitConfirmation() {
    if (confirm('Do you want to exit the app?')) {
      App.exitApp(); 
    }
  }




}
