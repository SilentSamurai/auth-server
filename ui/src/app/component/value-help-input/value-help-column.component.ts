import {Component, Input, OnInit} from '@angular/core';

function parseBoolean(value: string): boolean {
    const lowerCaseStr = value.toLowerCase();
    return lowerCaseStr === 'true';
}

@Component({
    selector: 'app-vh-col',
    template: '',
    styles: [],
})
export class ValueHelpColumnComponent implements OnInit {
    @Input() label: string = '';
    @Input() name: string = '';
    @Input() isId: string | boolean = false;

    constructor() {
    }

    async ngOnInit(): Promise<void> {
        if (typeof this.isId === 'string') {
            this.isId = parseBoolean(this.isId);
        }
    }
}
