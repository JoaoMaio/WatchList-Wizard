import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavBarComponent } from "../components/navbar/nav-bar/nav-bar.component";
import { App } from '@capacitor/app';
import { CacheDateService } from '../services/cache.service';
import {ApiService} from '../services/api.service';
import { DatabaseService } from '../services/sqlite.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true,
  imports: [RouterModule, NavBarComponent],
})

export class AppComponent implements OnInit, OnDestroy {
  title = 'TMDBApp';

  constructor(private cacheDateService: CacheDateService,
              private generalApi: ApiService,
              private databaseService: DatabaseService
            ) {}

  async ngOnInit() {
    this.setupBackButtonListener();
    await this.cacheDateService.checkAndClearCache();
    // await this.generalApi.createAllFiles();
    await this.databaseService.initializeDatabase();
  }

  async ngOnDestroy() {
    console.log('Closing database');
    await this.databaseService.closeDatabase();
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
