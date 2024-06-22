import {Component, Injectable, OnInit} from "@angular/core";
import {NgbActiveModal, NgbModal} from "@ng-bootstrap/ng-bootstrap";


export interface ConfirmationOptions {
    message: string;
    header?: string;
    icon?: string;
    acceptIcon?: string | null;
    rejectIcon?: string | null;
    accept: () => any;
    reject: () => any;
}

@Injectable({
    providedIn: 'root'
})
export class ConfirmationService {

    constructor(private modalService: NgbModal) {

    }

    async confirm(options: ConfirmationOptions) {
        const modalRef = this.modalService.open(
            ConfirmationDialogComponent,
            {centered: true, backdrop: 'static'});
        modalRef.componentInstance.message = options.message;
        modalRef.componentInstance.header = options.header ? options.header : 'Confirmation';
        modalRef.componentInstance.icon = options.icon ? options.icon : 'fa fa-info-circle';
        modalRef.componentInstance.rejectIcon = options.rejectIcon ? options.rejectIcon : null;
        modalRef.componentInstance.acceptIcon = options.acceptIcon ? options.acceptIcon : null;
        const returnedValue = await modalRef.result;
        if (returnedValue === "YES") {
            if (options.accept) {
                await options.accept();
            }
        } else {
            if (options.reject) {
                await options.reject();
            }
        }
    }

}


@Component({
    selector: 'app-confirmation-dialog',
    template: `
        <app-standard-dialog title="{{header}}" subtitle="------ xxx ------">
            <app-dialog-tab name="Content">
                <p><i class="{{icon}} pe-2 pt-2"></i> {{ message }} </p>
            </app-dialog-tab>
            <app-dialog-footer>
                <button (click)="activeModal.close('NO')" class="btn btn-secondary" type="button">
                    <i class="{{rejectIcon}} pe-2" *ngIf="rejectIcon"></i>
                    No
                </button>
                <button (click)="onYes()" class="btn btn-primary" type="button">
                    <i class="{{acceptIcon}} pe-2" *ngIf="acceptIcon"></i>
                    Yes
                </button>
            </app-dialog-footer>
        </app-standard-dialog>
    `,
    styles: [],
})
export class ConfirmationDialogComponent implements OnInit {

    header: string = "";
    message: string = "";
    icon: string = "";
    acceptIcon: string | null = null;
    rejectIcon: string | null = null;

    constructor(public activeModal: NgbActiveModal) {
    }

    async ngOnInit(): Promise<void> {
    }

    onYes() {
        this.activeModal.close("YES");
    }
}
