import {Injectable} from '@angular/core';
import {BehaviorSubject, lastValueFrom} from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    private darkMode = new BehaviorSubject<boolean>(false);
    darkMode$ = this.darkMode.asObservable();

    constructor() {
        // Check if user has a theme preference in localStorage
        const savedTheme = localStorage.getItem('darkMode');
        if (savedTheme !== null) {
            this.darkMode.next(savedTheme === 'true');
        } else {
            // Check system preference
            const prefersDark = window.matchMedia(
                '(prefers-color-scheme: dark)',
            ).matches;
            this.darkMode.next(prefersDark);
        }

        // Make sure the initial theme is applied on first load
        this.applyTheme(this.darkMode.value);
    }

    toggleTheme() {
        const currentValue = this.darkMode.value;
        this.darkMode.next(!currentValue);
        localStorage.setItem('darkMode', (!currentValue).toString());
        this.applyTheme(!currentValue);
    }

    private applyTheme(isDark: boolean) {
        const rootEl = document.documentElement; // <html> element
        const bodyEl = document.body;

        if (isDark) {
            // Your own CSS helper classes
            bodyEl.classList.add('dark-theme');
            bodyEl.classList.remove('light-theme');

            // Bootstrap 5.3+ colour‑mode switch
            rootEl.setAttribute('data-bs-theme', 'dark');
        } else {
            bodyEl.classList.add('light-theme');
            bodyEl.classList.remove('dark-theme');

            // Bootstrap attribute back to light (or remove attribute)
            rootEl.removeAttribute('data-bs-theme');
            // Alternatively:
            // rootEl.setAttribute('data-bs-theme', 'light');
        }
    }
}
