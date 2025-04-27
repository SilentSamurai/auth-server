import {
    Component,
    Input,
    OnInit,
    QueryList,
    TemplateRef,
    ViewChild,
} from '@angular/core';

@Component({
    selector: 'app-op-tab',
    template: `
        <ng-template #OPTC>
            <ng-content></ng-content>
        </ng-template>
    `,
    styles: [''],
    providers: [],
})
export class ObjectPageTabComponent implements OnInit {
    @Input() name: string = '';

    loading = true;

    @ViewChild('OPTC', {static: true}) template!: TemplateRef<any>;

    constructor() {}

    async ngOnInit() {
        this.loading = true;
        this.loading = false;
    }
}
