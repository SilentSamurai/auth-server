import {AfterViewInit, Component, ContentChild, ContentChildren, Input, QueryList} from "@angular/core";
import {MessageService} from "primeng/api";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {DialogActionsComponent} from "./dialog-actions.component";
import {DialogTabComponent} from "./dialog-tab.component";
import {DialogFooterComponent} from "./dialog-footer.component";

@Component({
    selector: 'app-standard-dialog',
    template: `
        <div class="modal-header d-flex justify-content-between bg-primary-subtle px-0 pb-0 pt-2">
            <div class="container-fluid">
                <div class="row mb-2">
                    <div class="col d-flex justify-content-between ">
                        <div class="mb-0 modal-title">
                            <div class="fw-semibold fs-4" style="margin-bottom: -0.25rem">{{ title }}</div>
                            <div class="p-disabled" style="font-size:small">{{ subtitle }}</div>
                        </div>
                        <div>
                            <ng-container *ngIf="actions" [ngTemplateOutlet]="actions.template"></ng-container>
                            <button (click)="activeModal.close('Cross click')"
                                    aria-label="Close"
                                    class="btn-sm btn "
                                    type="button">
                                <span aria-hidden="true">
                                    <i class="fa fa-icons fa-close"></i>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="row" *ngIf="tabs.length > 1">
                    <ul class="nav nav-tabs" role="tablist">
                        <li class="nav-item" role="presentation" *ngFor="let tab of tabs">
                            <button class="nav-link {{isTabVisible(tab) ? 'tab-bottom-color' : ''}}
                            text-capitalize dialog-tab
                             bg-primary-subtle py-0 fw-semibold"
                                    id="{{tab.name}}_DIALOG_TAB_NAV"
                                    (click)="onNavLink(tab)">
                                {{ tab.name }}
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="modal-body tab-content">
            <ng-container *ngFor="let tab of tabs">
                <div *ngIf="isTabVisible(tab)" class="tab-pane fade show {{isTabVisible(tab) ? 'active' : ''}}">
                    <ng-container [ngTemplateOutlet]="tab.template"></ng-container>
                </div>
            </ng-container>
        </div>
        <div class="modal-footer py-2">
            <ng-container *ngIf="footer" [ngTemplateOutlet]="footer.template"></ng-container>
        </div>
    `,
    styles: [
        `
            .dialog-tab {
                color: black;
                font-size: smaller !important;
            }
            .nav-tabs .nav-link:hover, .nav-tabs .nav-link:focus {
                border-top-color: transparent !important;
                border-left-color: transparent !important;
                border-right-color: transparent !important;
            }
        `
    ],
})
export class StandardDialogComponent implements AfterViewInit {

    @Input() title: string = '';
    @Input() subtitle: string = '';

    @ContentChild(DialogActionsComponent)
    actions!: DialogActionsComponent;

    @ContentChildren(DialogTabComponent)
    tabs!: QueryList<DialogTabComponent>;
    activeTab!: DialogTabComponent;

    @ContentChild(DialogFooterComponent)
    footer!: DialogFooterComponent;

    constructor(private messageService: MessageService,
                public activeModal: NgbActiveModal) {
    }

    async ngOnInit(): Promise<void> {

    }

    ngAfterViewInit(): void {
        console.log(this.tabs);
    }

    isTabVisible(tab: DialogTabComponent): boolean {
        if (this.activeTab) {
            if (this.activeTab.name === tab.name) {
                return true;
            }
        } else {
            return this.tabs.first.name == tab.name;
        }
        return false;
    }

    onNavLink(tab: DialogTabComponent) {
        this.activeTab = tab;
    }
}


