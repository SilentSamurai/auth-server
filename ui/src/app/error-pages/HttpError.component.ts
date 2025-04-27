import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";

@Component({
    selector: 'app-error-page',
    template: `
        <div class="container">
            <header class="jumbotron">
                <h1 class="mt-4">Error "{{ msg }}"</h1>
                <p>Sorry, something went wrong!</p>
            </header>
        </div>
    `,
    styles: ['']
})
export class HttpErrorComponent implements OnInit {

    msg: string = "";

    constructor(private actRoute: ActivatedRoute) {
    }

    ngOnInit(): void {
        this.msg = this.actRoute.snapshot.params['msg'];
    }


}
