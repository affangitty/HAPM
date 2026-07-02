import { Component, contentChildren, effect, inject, input } from '@angular/core';
import { cn } from '../../../utils/cn';
import { FormFieldA11yHost } from './form-field-a11y.host';
import { FORM_FIELD_LINKABLE } from './form-field-linkable';

@Component({
  selector: 'app-form-field',
  standalone: true,
  providers: [FormFieldA11yHost],
  template: `
    <div [class]="cn('flex flex-col gap-1.5', className())">
      @if (label()) {
        <label class="text-sm font-medium text-foreground" [attr.for]="resolvedId()">
          {{ label() }}
          @if (required()) {
            <span class="text-destructive" aria-hidden="true">*</span>
          }
        </label>
      }
      <ng-content />
      @if (hint() && !error()) {
        <p class="text-xs text-muted-foreground" [id]="a11y.hintId">{{ hint() }}</p>
      }
      @if (error()) {
        <p class="text-xs text-destructive" role="alert" [id]="a11y.errorId">{{ error() }}</p>
      }
    </div>
  `,
})
export class FormFieldComponent {
  protected readonly a11y = inject(FormFieldA11yHost);
  private readonly linkedControls = contentChildren(FORM_FIELD_LINKABLE, { descendants: true });

  readonly label = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly required = input(false);
  readonly className = input('', { alias: 'class' });
  readonly fieldId = input<string | null>(null);

  readonly resolvedId = () => this.fieldId() ?? this.a11y.controlId;

  constructor() {
    effect(() => {
      const host = this.a11y;
      for (const control of this.linkedControls()) {
        control.linkFormField(host);
      }
    });

    effect(() => {
      this.a11y.error = this.error();
      this.a11y.hint = this.hint();
    });
  }

  protected readonly cn = cn;
}
