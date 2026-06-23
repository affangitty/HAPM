import { Component, computed, input } from '@angular/core';
import { UiStatusBadgeComponent } from '../../../shared/components/ui/status-badge/ui-status-badge.component';
import { LAB_REPORT_STATUS_TONE, LabReportStatus } from '../../../shared/models/enums';

@Component({
  selector: 'app-lab-report-status-badge',
  standalone: true,
  imports: [UiStatusBadgeComponent],
  template: `<app-ui-status-badge [label]="status()" [tone]="tone()" />`,
})
export class LabReportStatusBadgeComponent {
  readonly status = input.required<LabReportStatus>();
  readonly tone = computed(() => LAB_REPORT_STATUS_TONE[this.status()]);
}
