import { AfterViewInit, Component, ComponentRef, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import {ApiService, EmptySimpleObject, SimpleObject} from '../../services/api.service';
import {CommonModule} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../environment';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { CustomToastrComponent } from '../custom-toastr/custom-toastr.component';
import { DatabaseService } from '../../services/sqlite.service';

@Component({
  selector: 'app-edit-banner',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './edit-banner.component.html',
  styleUrl: './edit-banner.component.scss'
})
export class EditBannerComponent implements OnInit, OnDestroy, AfterViewInit {

  allShows: SimpleObject[] = []
  allMovies: SimpleObject[] = []
  searchResults: SimpleObject[] = []
  imgPath = environment.imgPath;
  selectedMedia: SimpleObject = EmptySimpleObject;
  selectedMediaImages: string[] = [];

  isLoading: boolean = false;
  showMediamodal: boolean = false;
  searchQuery: string = '';

  private BANNER_IMAGE = 'bannerImage';

  @ViewChild('toastrContainer', { read: ViewContainerRef }) toastrContainer!: ViewContainerRef;

  toastrRef!: ComponentRef<CustomToastrComponent>;


  constructor(private api: ApiService,
              private router: Router,
              private databaseService: DatabaseService
  ) { }

  ngAfterViewInit(): void {

  }

  ngOnInit() {
    this.isLoading = true;

    const shows = this.databaseService.getShows().then((response) => {
      response.forEach((show) => {
        this.allShows.push({
          id: show.id,
          original_title: show.original_title,
          title: show.original_title,
          poster_path: show.poster_path,
          type: "tvshow",
          popularity: 0,
          timesWatched: show.timesWatched,
          status: show.status
        });
      });
    })

    const movies = this.databaseService.getMovies().then((response) => {
      response.forEach((movie) => {
        this.allMovies.push({
          id: movie.id,
          original_title: movie.original_title,
          title: movie.original_title,
          poster_path: movie.poster_path,
          type: "movie",
          popularity: 0,
          timesWatched: movie.timesWatched,
          status: movie.status
        });
      });
    })

    Promise.all([shows, movies]).then(() => {
      this.searchResults = [... this.allShows, ... this.allMovies]
      this.order()
    })

  }

  order(){
    this.searchResults.sort((a, b) => {
      return a.title.localeCompare(b.title)
    })
  }

  search(){
    this.searchResults = [...this.allShows, ...this.allMovies].filter((item) => {
      return item.title.toLowerCase().includes(this.searchQuery.toLowerCase())
    })

    this.order()
  }

  closeModal() {
    this.router.navigate(['/profile']);
  }

  seeMedia(media: SimpleObject) {
   this.selectedMedia = media;

    this.api.getImages(media.id, media.type == 'tvshow' ? 'tv' : 'movie').subscribe({
      next: (response) => {
        for (let i = 0; i < response.length; i++) {
          this.selectedMediaImages.push(this.imgPath +  response[i])
        }
        this.showMediamodal = true;
      }
    })
  }

  closeMediaModal() {
    this.showMediamodal = false;
    this.selectedMedia = EmptySimpleObject;
    this.selectedMediaImages = [];
  }

  async saveImageAsBanner(url: string) {
    await Preferences.set({
      key: this.BANNER_IMAGE,
      value: url,
    });
    this.closeMediaModal();
    this.showToastr('Banner updated successfully', 'green');
  }

  ngOnDestroy(): void {
    this.selectedMedia = EmptySimpleObject;
    this.selectedMediaImages = [];
  }

  // Dynamically create the CustomToastrComponent
  showToastr(message: string, bgColor: string) {
    if (this.toastrRef) {
      this.toastrRef.destroy();
    }

    this.toastrRef = this.toastrContainer.createComponent(CustomToastrComponent);
    this.toastrRef.instance.message = message;
    this.toastrRef.instance.bgColor = "var(--a_quinaryColor)";

    // Set the toastr to disappear after 4 seconds, but with animation
    setTimeout(() => {
      this.toastrRef.instance.hideToastr();
    }, 4000);

    this.toastrRef.instance.animationStateChange.subscribe(() => {
        this.toastrRef.destroy();
    });
  }

}
