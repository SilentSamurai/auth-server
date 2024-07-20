import {AfterViewInit, Component, ContentChild, ElementRef, OnInit, ViewChild} from '@angular/core';
import {UserService} from '../_services/user.service';
import {TokenStorageService} from "../_services/token-storage.service";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../_services/auth.service";
import {AuthDefaultService} from "../_services/auth.default.service";
import {DomSanitizer} from "@angular/platform-browser";
import {fromEvent, skip, window} from "rxjs";


@Component({
    selector: 'app-view',
    template: `
        <nav-bar *ngIf="!loading"></nav-bar>
        <iframe #iframe id="main-iframe"
                [src]="navUrl"
                title="{{title}}"
                class="w-100 h-100  "
                (load)="test(iframe)"
                style="min-height: 93vh !important;">

        </iframe>
    `,
    styles: [``]
})
export class AppViewComponent implements OnInit, AfterViewInit {
    content?: string;
    user: any;
    loading = true;
    navUrl: any = "";
    title: string = "";

    @ViewChild('iframe')
    iframe: ElementRef | null = null;

    constructor(private userService: UserService,
                private router: Router,
                private route: ActivatedRoute,
                private authService: AuthService,
                private authDefaultService: AuthDefaultService,
                private sanitizer: DomSanitizer,
                private tokenStorage: TokenStorageService) {
    }

    ngOnInit(): void {
        this.authDefaultService.resetTitle();

        this.navUrl = this.route.snapshot.params[0] as string;
        this.navUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.navUrl);
        this.title = this.route.snapshot.queryParamMap.get('title') as string;

        this.authDefaultService.setTitle(this.title);
        this.startUp();
    }

    async startUp(): Promise<void> {
        // let params = this.route.snapshot.queryParamMap;
        this.user = this.tokenStorage.getUser();
        this.loading = false;
    }

    reloadPage(): void {
        // window.location.reload();
    }

    test(frame: any): void {
        console.log(frame);
    }

    ngAfterViewInit(): void {
        fromEvent(this.iframe!.nativeElement.contentWindow.location.href, 'change')
            // Skip the initial load event and only capture subsequent events.
            .pipe(skip(1))
            .subscribe((event) => console.log(event));
    }
}
