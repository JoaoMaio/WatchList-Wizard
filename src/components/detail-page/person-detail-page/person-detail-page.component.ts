import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environment';
import { ApiService, Credits, EmptyPerson, Person, SimpleObject } from '../../../services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-person-detail-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './person-detail-page.component.html',
  styleUrl: './person-detail-page.component.scss'
})
export class PersonDetailPageComponent implements OnInit{

  isLoading: boolean = true;
  personId: number = 0;
  person: Person = EmptyPerson;
  knownFor:  [Credits[], Credits[]] = [ [], [] ];

  knownForCast: Credits[] = [];
  knownForCrew: Credits[] = [];
  knownForCrewByJob: { [key: string]: Credits[] } = {}; 

  backgroundImg: string = '';

  tabs = ["Bio"]

  imgPath = environment.imgPath;
  backdropPath = environment.backdropPath;

  selectedTab: string = 'Bio';

  constructor(public api: ApiService,
              private route: ActivatedRoute,
              private router: Router
    ) { }

  ngOnInit(): void {
    this.isLoading  = true;
    this.route.params.subscribe(params => {
      this.personId = params['id'];
    });

    Promise.all([
      this.getPersonDetails(),
      this.getPersonKnownFor()
    ]).then(() => {      
      this.getBackgroundImage();
    }).catch((error) => {
      console.error('Error fetching data:', error);
      this.isLoading = false;
    });
  }

  getPersonDetails() {
    return new Promise<void>((resolve, reject) => {
      this.api.getPersonDetails(this.personId).subscribe({
        next: (response: Person) => {
          this.person = response;
          resolve();
        },
        error: (error) => {
          console.error('Error fetching person details:', error);
          reject();
        }
      });
    });
  }

  getPersonKnownFor() {
    return new Promise<void>((resolve, reject) => {
      this.api.getPersonKnownFor(this.personId).subscribe({
        next: (response: [Credits[], Credits[]]) => {
          this.knownFor = response;

          this.knownForCast = this.knownFor[0];

          //order by popularity
          this.knownForCast.sort((a, b) => b.object.popularity - a.object.popularity);

          this.knownForCrew = this.knownFor[1];

          if (this.knownForCast.length > 0) 
            this.tabs.push("Acting");
          
          if (this.knownForCrew.length > 0)      
            this.knownForCrewByJob = this.groupByJob(this.knownForCrew);

          resolve();
        },
        error: (error) => {
          console.error('Error fetching person known for:', error);
          reject();
        }
      });
    });
  }

  private groupByJob(crew: Credits[]): { [key: string]: Credits[] } {
    // Define the jobs you want to include
    const allowedJobs = ['Director', 'Executive Producer', 'Producer', 'Writer'];
  
    // order by popularity
    crew.sort((a, b) => b.object.popularity - a.object.popularity);


    // Create a map to group crew credits
    const groupedCrew = crew.reduce((acc, credit) => {
      // Skip jobs that are not in the allowed list
      const job = credit.job;

      if (!job || !allowedJobs.includes(job)) return acc;
  
      // Combine "Executive Producer" and "Producer" under the "Producer" category
      const normalizedJob = (job === 'Executive Producer') ? 'Producer' : job;
  
      // Initialize category if it doesn't exist
      if (!acc[normalizedJob]) {
        acc[normalizedJob] = [];
      }
  
      // Check for duplicates based on object.title
      const isDuplicate = acc[normalizedJob].some(existingCredit => 
        existingCredit.object.title === credit.object.title
      );
  
      if (!isDuplicate) {
        acc[normalizedJob].push(credit);
        if (job === 'Executive Producer')
        {
          if (!this.tabs.includes('Producer'))
            this.tabs.push('Producer');
        }
        else 
        {
          if (!this.tabs.includes(job))
            this.tabs.push(job);
        }

      }
  
      return acc;
    }, {} as { [key: string]: Credits[] });
  
    return groupedCrew;
  }
  
  objectKeys(obj: object): string[] {
    return Object.keys(obj);
  }
  
  selectTab(tab: string) {
    this.selectedTab = tab; 
  }

  showInfo(object: SimpleObject) {
      this.router.navigate([`/info/${object.type}`, object.id]);
  }

  getBackgroundImage(){

    var obj = 0;

    if(this.person.known_for_department === 'Crew')
      obj = this.knownForCrew[0].object.id;

    if(this.person.known_for_department === 'Acting')
      obj = this.knownForCast[0].object.id;


    this.api.getImages(obj, this.knownForCast[0].object.type == 'tvshow' ? 'tv' : 'movie' ).subscribe({
      next: (response: any) => {
        this.backgroundImg = response[0];
      },
      error: (error) => {
        console.error('Error fetching person images:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }


}
