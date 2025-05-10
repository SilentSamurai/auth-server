import {
    Component,
    ContentChildren,
    forwardRef,
    Inject,
    Injector,
    Input,
    OnInit,
    QueryList,
    TemplateRef,
    ViewChild,
} from '@angular/core';
import {
    ControlValueAccessor,
    FormControl,
    FormControlDirective,
    FormControlName,
    FormGroupDirective,
    NG_VALUE_ACCESSOR,
    NgControl,
    UntypedFormControl,
    Validators,
} from '@angular/forms';
import {InputErrorComponent} from './input-error.component';
import {randomId} from "../util/utils";

@Component({
    selector: 'app-select-option',
    template: `
        <ng-template #ASO>
            <ng-content></ng-content>
        </ng-template>
    `,
    styles: [''],
    providers: [],
})
export class SelectOptionComponent implements OnInit {
    @Input({required: true}) value: string = '';

    loading = true;

    @ViewChild('ASO', {static: true}) template!: TemplateRef<any>;

    constructor() {
    }

    async ngOnInit() {
        this.loading = true;
        this.loading = false;
    }
}

@Component({
    selector: 'app-select-input',
    template: `
        <div class="form-group row mb-2">
            <label
                class="col-auto col-md-4 col-form-label form-label fw-semibold text-end {{
                    disabled ? 'p-disabled' : ''
                }}"
                for="{{ test_id }}_{{ formControlName }}_INPUT"
            >
                {{ label }}:<span *ngIf="required" class="text-danger">*</span>
            </label>
            <div class="col-auto col-md-8">
                <select
                    class="form-select"
                    [disabled]="disabled"
                    (blur)="onTouched()"
                    (change)="onSelectChange($event.target)"
                >
                    <option disabled value="" selected></option>
                    <option
                        *ngFor="let option of options"
                        class="text-truncate"
                        [value]="option.value"
                        selected="{{
                            value === option.value ? 'selected' : ''
                        }}"
                    >
                        <ng-container
                            *ngIf="option.template"
                            [ngTemplateOutlet]="option.template"
                        ></ng-container>
                    </option>
                </select>
            </div>
            <div
                *ngIf="control.invalid && (control.dirty || control.touched)"
                class="text-danger text-end"
                role="alert"
            >
                <div *ngIf="control.hasError('required')">
                    {{ label }} is required.
                </div>
                <ng-container *ngFor="let eh of inputErrors">
                    <div *ngIf="control.hasError(eh.field)">
                        <ng-container
                            [ngTemplateOutlet]="eh.template"
                        ></ng-container>
                    </div>
                </ng-container>
            </div>
        </div>
    `,
    styles: [``],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SelectInputComponent),
            multi: true,
        },
    ],
})
export class SelectInputComponent implements ControlValueAccessor, OnInit {
    @Input() test_id: string = randomId();
    @Input({required: true}) formControlName: string = '';
    @Input({required: true}) label: string = '';

    disabled = false;
    @Input() value = '';

    @ContentChildren(SelectOptionComponent)
    options!: QueryList<SelectOptionComponent>;

    @ContentChildren(InputErrorComponent)
    inputErrors!: QueryList<InputErrorComponent>;

    formControl!: UntypedFormControl;

    constructor(@Inject(Injector) private injector: Injector) {
    }

    get required() {
        return this.control?.hasValidator(Validators.required);
    }

    get control() {
        return this.formControl!;
    }

    async ngOnInit(): Promise<void> {
        // console.log("pool: ", this.disabled)
        this.setFormControl();
    }

    setFormControl() {
        try {
            const formControl = this.injector.get(NgControl);
            switch (formControl.constructor) {
                case FormControlName:
                    this.formControl = this.injector
                        .get(FormGroupDirective)
                        .getControl(formControl as FormControlName);
                    break;
                default:
                    this.formControl = (formControl as FormControlDirective)
                        .form as FormControl;
                    break;
            }
        } catch (err) {
            console.error(err);
            this.formControl = new FormControl();
        }
    }

    // Function to call when the value changes.
    onChange = (value: string) => {
    };

    // Function to call when the input is touched (blurred).
    onTouched = () => {
    };

    // Called by Angular to write the value to the component.
    writeValue(value: string): void {
        this.value = value;
    }

    // Called by Angular to register a function that should be called when the value changes.
    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    // Called by Angular to register a function that should be called when the control is touched.
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    // Called by Angular to disable the component.
    setDisabledState?(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    // Update the value and notify the form control.
    onSelectChange(target: any): void {
        this.value = target.value;
        this.onChange(this.value);
        this.onTouched();
    }

    ngAfterViewInit(): void {
    }
}
