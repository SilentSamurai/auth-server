import {
    Component,
    ContentChildren,
    Input,
    OnInit,
    QueryList,
    TemplateRef,
    ViewChild,
} from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';

@Component({
    selector: 'app-input-error',
    template: `
        <ng-template #INPERR>
            <ng-content></ng-content>
        </ng-template>
    `,
    styles: [],
})
export class InputErrorComponent implements OnInit {
    @Input() field: string = '';
    @ViewChild('INPERR', { static: true }) template!: TemplateRef<any>;

    constructor() {}

    async ngOnInit(): Promise<void> {}
}

@Component({
    selector: 'app-text-input',
    template: `
        <div class="form-group mb-3">
            <label
                class="form-label"
                for="{{ formName }}_{{ formField }}_INPUT"
                >{{ label }}</label
            >
            <input
                [formControl]="formControl"
                class="form-control"
                id="{{ formName }}_{{ formField }}_INPUT"
                name="{{ formField }}"
                type="{{ type }}"
                [readonly]="readonly"
            />
            <div
                *ngIf="field.invalid && (field.dirty || field.touched)"
                class="text-danger"
                role="alert"
            >
                <div *ngIf="field.hasError('required')">
                    {{ label }} is required.
                </div>
                <ng-container *ngFor="let eh of inputErrors">
                    <div *ngIf="field.hasError(eh.field)">
                        <ng-container
                            [ngTemplateOutlet]="eh.template"
                        ></ng-container>
                    </div>
                </ng-container>
            </div>
        </div>
    `,
    styles: [],
})
export class TextInputComponent implements OnInit {
    @Input() formName: string = '';
    @Input() form!: UntypedFormGroup;
    @Input() formField: string = '';
    @Input() label: string = '';
    @Input() value: string = '';
    @Input() type: string = 'text';
    @Input() readonly: boolean = false;
    formControl!: UntypedFormControl;

    @ContentChildren(InputErrorComponent)
    inputErrors!: QueryList<InputErrorComponent>;

    constructor() {}

    async ngOnInit(): Promise<void> {
        this.formControl = this.form.get(this.formField) as UntypedFormControl;
        if (this.value && this.value.length > 0) {
            this.field.setValue(this.value);
        }
    }

    get field() {
        return this.form.get(this.formField)!;
    }
}
