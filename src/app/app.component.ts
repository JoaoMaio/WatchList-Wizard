import { Component, OnInit } from '@angular/core';
import { HomeComponentComponent } from '../components/home/home-component.component';
import { RouterModule } from '@angular/router';
import { NavBarComponent } from "../components/navbar/nav-bar/nav-bar.component";
import { App } from '@capacitor/app';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true,
  imports: [HomeComponentComponent, RouterModule, NavBarComponent],
})

export class AppComponent implements OnInit {
  title = 'TMDBApp';

  constructor() {}

  ngOnInit() {
    this.setupBackButtonListener();
  }

  setupBackButtonListener() {
    // Listen for the backButton event on Android
    App.addListener('backButton', ({ canGoBack }) => {
      // Logic to handle back button
      if (canGoBack) {
        // If the app can navigate back in the webview history
        window.history.back();
      } else {
        // Handle the case where there is no history, maybe exit the app
        this.showExitConfirmation();  // Implement your own logic here
      }
    });
  }

  showExitConfirmation() {
    // Show confirmation dialog before exiting the app
    if (confirm('Do you want to exit the app?')) {
      App.exitApp();  // Exit the app
    }
  }




}
