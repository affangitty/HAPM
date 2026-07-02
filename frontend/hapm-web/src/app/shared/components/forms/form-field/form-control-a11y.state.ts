import { inject, Injectable, Injector, signal } from '@angular/core';
import { FormControlName } from '@angular/forms';
import { FormFieldLinkable } from './form-field-linkable';
import { FormFieldA11yHost } from './form-field-a11y.host';

let controlSeq = 0;

@Injectable()
export class FormControlA11yState implements FormFieldLinkable {
  private readonly injector = inject(Injector);
  private readonly linkedFieldId = signal<string | null>(null);
  private readonly linkedHost = signal<FormFieldA11yHost | null>(null);
  private readonly fallbackId = `fc-${++controlSeq}`;

  linkFormField(host: FormFieldA11yHost): void {
    this.linkedFieldId.set(host.controlId);
    this.linkedHost.set(host);
  }

  fieldHost(): FormFieldA11yHost | null {
    return this.linkedHost();
  }

  resolveId(explicitId: string | null | undefined): string {
    return explicitId ?? this.linkedFieldId() ?? this.fallbackId;
  }

  resolveName(explicitName: string | null | undefined, resolvedId: string): string {
    if (explicitName) return explicitName;
    const controlName = this.injector.get(FormControlName, null, { optional: true, self: true });
    const name = controlName?.name;
    if (name != null && name !== '') return String(name);
    return resolvedId;
  }
}
