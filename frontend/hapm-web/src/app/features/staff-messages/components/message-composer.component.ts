import { Component, input, output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiTextareaComponent } from '../../../shared/components/ui/textarea/ui-textarea.component';

@Component({
  selector: 'app-message-composer',
  standalone: true,
  imports: [ReactiveFormsModule, UiTextareaComponent, UiButtonComponent],
  template: `
    <form class="flex flex-col gap-2 border-t bg-card p-3 sm:flex-row sm:items-end" [formGroup]="form" (ngSubmit)="submit()">
      <app-ui-textarea class="flex-1" formControlName="content" [rows]="2" placeholder="Type a message..." />
      <app-ui-button type="submit" [loading]="sending()" [disabled]="form.invalid">Send</app-ui-button>
    </form>
  `,
})
export class MessageComposerComponent {
  private readonly fb = inject(FormBuilder);

  readonly sending = input(false);
  readonly send = output<string>();

  readonly form = this.fb.nonNullable.group({
    content: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  submit(): void {
    if (this.form.invalid) return;
    const content = this.form.getRawValue().content.trim();
    if (!content) return;
    this.send.emit(content);
    this.form.reset();
  }
}