import {Component, Input, OnInit} from '@angular/core';

import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute} from "@angular/router";
import {UserService} from "../../_services/user.service";
import {ValueHelpComponent} from "../value-help/value-help.component";

@Component({
    selector: 'app-value-help-input',
    templateUrl: './value-help-input.component.html',
    styleUrls: ['./value-help-input.component.css']
})
export class ValueHelpInputComponent implements OnInit {

    @Input() name: string = '';
    @Input() multi: boolean = false;

    data = [];

    constructor(private userService: UserService,
                private route: ActivatedRoute,
                private modalService: NgbModal) {
    }

    async ngOnInit(): Promise<void> {

    }

    async openValueHelp() {
        const modalRef = this.modalService.open(ValueHelpComponent, {size: 'lg', backdrop: 'static'});
        let instance = modalRef.componentInstance;
        instance.multi = this.multi;
        const user = await modalRef.result;
        console.log(user);
    }
}
