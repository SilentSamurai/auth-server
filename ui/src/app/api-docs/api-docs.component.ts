import {Component, OnInit} from '@angular/core';

@Component({
    selector: 'api-docs',
    templateUrl: './api-docs.component.html',
    styleUrls: ['./api-docs.component.scss']
})
export class ApiDocsComponent implements OnInit {

    constructor() {
    }

    async ngOnInit(): Promise<void> {
    }

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
            id: "pgt",
            title: "OAuth Token (Password Grant Type)",
            description: "",
            method: "POST",
            path: "/api/oauth/token",
            request: {
                contentType: "application/json",
                parameters: [
                    {
                        name: "",
                        required: true,
                        type: "",
                        description: ""
                    }
                ],
                body: {
                    grant_type: "password",
                    email: "string",
                    password: "string",
                    domain: "string"
                }
            },
            response: {
                contentType: "application/json",
                body: {
                    access_token: "string",
                    token_type: "string",
                    expires_in: "string",
                    refresh_token: "string"
                }
            }
        },
        {
            id: "ccgt",
            title: "OAuth Token (Client Grant Type)",
            description: "",
            method: "POST",
            path: "/api/oauth/token",
            request: {
                contentType: "application/json",
                parameters: [],
                body: {
                    grant_type: "client_credential",
                    client_id: "string",
                    client_secret: "string",
                }
            },
            response: {
                contentType: "application/json",
                body: {
                    access_token: "string",
                    token_type: "string",
                    expires_in: "string",
                }
            }
        },
        {
            id: "rtgt",
            title: "OAuth Token (Refresh Grant Type)",
            description: "",
            method: "POST",
            path: "/api/oauth/token",
            request: {
                contentType: "application/json",
                parameters: [],
                body: {
                    grant_type: "refresh_token",
                    refresh_token: "string",
                }
            },
            response: {
                contentType: "application/json",
                body: {
                    access_token: "string",
                    token_type: "string",
                    expires_in: "string",
                }
            }
        },
        {
            id: "vtkn",
            title: "Verify Access Token",
            description: "",
            method: "POST",
            path: "/api/oauth/verify",
            request: {
                contentType: "application/json",
                parameters: [],
                body: {
                    access_token: "string",
                    client_id: "string",
                    client_secret: "string",
                }
            },
            response: {
                contentType: "application/json",
                body: this.JWT_STRUCTURE
            }
        },
        {
            id: "tknexchng",
            title: "Access Token Exchange",
            description: "",
            method: "POST",
            path: "/api/oauth/exchange",
            request: {
                contentType: "application/json",
                parameters: [],
                body: {
                    access_token: "string",
                    client_id: "string | client_id of exchange tenant",
                    client_secret: "string",
                }
            },
            response: {
                contentType: "application/json",
                body: {
                    grant_type: "password",
                    email: "string",
                    password: "string",
                    domain: "string"
                }
            }
        }
    ]

    scroll(elementId: string) {
        let elementById = document.getElementById(elementId);
        elementById?.scrollIntoView({behavior: 'smooth'})
    }
}
