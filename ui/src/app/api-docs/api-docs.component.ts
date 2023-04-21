import {Component, OnInit} from '@angular/core';

@Component({
    selector: 'api-docs',
    templateUrl: './api-docs.component.html',
    styleUrls: ['./api-docs.component.css']
})
export class ApiDocsComponent implements OnInit {


    JWT_STRUCTURE = {
        sub: "string",
        email: "string",
        name: "string",
        tenant: {
            id: "string",
            name: "string",
            domain: "string",
        },
        scopes: "string[]",
        grant_type: "password | client_credential"
    }

    APIS = [
        {
            title: "Password Grant Type",
            description: "",
            method: "POST",
            api: "/api/oauth/token",
            request: {
                contentType: "application/json",
                parameters: [],
                body: [
                    {
                        title: "",
                        required: true,
                        type: "",
                        description: ""
                    }
                ]
            },
            response: {}
        }
    ]

    constructor() {
    }

    async ngOnInit(): Promise<void> {
    }

    scroll(el: HTMLElement) {
        el.scrollIntoView({behavior: 'smooth'});
    }
}
