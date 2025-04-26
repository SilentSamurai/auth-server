import {Component, OnInit} from '@angular/core';
import {ThemeService} from './_services/theme.service';
import {ThemeToggleComponent} from './component/theme-toggle/theme-toggle.component';
import {RouterOutlet} from '@angular/router';
import {ToastModule} from 'primeng/toast';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    constructor(private themeService: ThemeService) {}

    ngOnInit(): void {}
}
