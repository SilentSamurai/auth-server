import {Component, Input} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {AppService} from '../../../_services/app.service';
import {SessionService} from '../../../_services/session.service';

@Component({
    selector: 'app-update-app',
    template: `
        <div class="modal-header">
            <h4 class="modal-title">Update App</h4>
            <button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss()"></button>
        </div>
        <div class="modal-body">
            <form (ngSubmit)="onSubmit()">
                <div class="mb-3">
                    <label for="name" class="form-label">Name</label>
                    <input type="text" class="form-control" id="name" [(ngModel)]="app.name" name="name" required>
                </div>
                <div class="mb-3">
                    <label for="appUrl" class="form-label">App URL</label>
                    <input type="text" class="form-control" id="appUrl" [(ngModel)]="app.appUrl" name="appUrl" required>
                </div>
                <div class="mb-3">
                    <label for="description" class="form-label">Description</label>
                    <textarea class="form-control" id="description" [(ngModel)]="app.description" name="description" rows="3"></textarea>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" (click)="activeModal.dismiss()">Cancel</button>
            <button type="button" class="btn btn-primary" (click)="onSubmit()">Update</button>
        </div>
    `
})
export class UpdateAppComponent {
    @Input() app: any;

    constructor(
        public activeModal: NgbActiveModal,
        private appService: AppService,
        private sessionService: SessionService
    ) {
    }

    async onSubmit() {
        try {
            await this.appService.updateApp(
                this.app.id,
                this.app.name,
                this.app.appUrl,
                this.app.description
            );
            this.activeModal.close(this.app);
        } catch (error) {
            console.error('Error updating app:', error);
            this.activeModal.dismiss();
        }
    }
}
