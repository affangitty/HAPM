import { Component, input } from '@angular/core';
import { cn } from '../../../utils/cn';
import { StatusTone } from '../../../models/enums';

@Component({
  selector: 'app-ui-badge',
  standalone: true,
  template: `<span [class]="classes"><ng-content /></span>`,
})
export class UiBadgeComponent {
  readonly variant = input<StatusTone | 'outline' | 'default'>('default');
  readonly className = input('', { alias: 'class' });

  get classes(): string {
    return cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
      this.variantClasses(),
      this.className(),
    );
  }

  private variantClasses(): string {
    const map: Record<string, string> = {
      default: 'border-transparent bg-primary text-primary-foreground',
      secondary: 'border-transparent bg-secondary text-secondary-foreground',
      success: 'border-transparent bg-emerald-100 text-emerald-800',
      warning: 'border-transparent bg-amber-100 text-amber-800',
      info: 'border-transparent bg-blue-100 text-blue-800',
      destructive: 'border-transparent bg-red-100 text-red-800',
      outline: 'text-foreground',
    };
    return map[this.variant()] ?? map['default'];
  }
}
