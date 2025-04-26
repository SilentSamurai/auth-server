import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-button-link',
    template: `
        <span
            *ngIf="isDisabled"
            class="disabled"
            (click)="_haltDisabledEvents($event)"
        >
            <ng-container *ngTemplateOutlet="content"></ng-container>
        </span>
        <a *ngIf="!isDisabled" href="javascript:void(0)">
            <ng-container *ngTemplateOutlet="content"></ng-container>
        </a>

        <ng-template #content>
            <ng-content></ng-content>
        </ng-template>
    `,
    styles: ['.disabled { color: gray; }'],
})
export class ButtonLinkComponent {
    @Input() disabled: any = null;

    @Output() click: EventEmitter<any> = new EventEmitter();

    get isDisabled(): boolean {
        return this.disabled != null;
    }

    _haltDisabledEvents(event: Event) {
        // A disabled button shouldn't apply any actions
        if (this.isDisabled) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }
}
