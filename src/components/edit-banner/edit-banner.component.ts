import { AfterViewInit, Component, ComponentRef, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ApiService, SimpleObject } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../environment';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { CustomToastrComponent } from '../custom-toastr/custom-toastr.component';

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
  selectedMedia: SimpleObject | undefined;
  selectedMediaImages: string[] = [];

  isLoading: boolean = false;
  showMediamodal: boolean = false;
  searchQuery: string = '';

  private BANNER_IMAGE = 'bannerImage';

  @ViewChild('toastrContainer', { read: ViewContainerRef }) toastrContainer!: ViewContainerRef;

  toastrRef!: ComponentRef<CustomToastrComponent>;


  constructor(private api: ApiService,
              private router: Router
  ) { }

  ngAfterViewInit(): void {
    
  }

  ngOnInit() {
    this.isLoading = true;

    const shows = this.api.getAllShowsOrMovies(0, 'tv').then((response) => {
      this.allShows.push(...response)
    })

    const movies = this.api.getAllShowsOrMovies(0, 'movie').then((response) => {
      this.allMovies.push(...response)
    })

    Promise.all([shows, movies]).then(() => {
      this.searchResults = [... this.allShows, ... this.allMovies]
      this.order()
    })

  }

  order()
  {
    //order by name
    this.searchResults.sort((a, b) => {
      return a.title.localeCompare(b.title)
    })
  }

  search()
  {
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

    //get images
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
    this.selectedMedia = undefined;
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
    this.selectedMedia = undefined;
    this.selectedMediaImages = [];
  }

  // Dynamically create the CustomToastrComponent
  showToastr(message: string, bgColor: string) {
    if (this.toastrRef) {
      this.toastrRef.destroy(); 
    }

    this.toastrRef = this.toastrContainer.createComponent(CustomToastrComponent);
    this.toastrRef.instance.message = message;
    this.toastrRef.instance.bgColor = "var(--quinaryColor)";

    // Set the toastr to disappear after 4 seconds, but with animation
    setTimeout(() => {
      this.toastrRef.instance.hideToastr();
    }, 4000); 

    this.toastrRef.instance.animationStateChange.subscribe(() => {
        this.toastrRef.destroy();
    });
  }

}