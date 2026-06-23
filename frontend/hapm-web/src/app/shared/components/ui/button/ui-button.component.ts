import { Component, input, output } from '@angular/core';
import { cn } from '../../../utils/cn';

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

@Component({
  selector: 'app-ui-button',
  standalone: true,
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [class]="classes"
      (click)="pressed.emit($event)"
    >
      @if (loading()) {
        <span class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
      }
      <ng-content />
    </button>
  `,
})
export class UiButtonComponent {
  readonly variant = input<ButtonVariant>('default');
  readonly size = input<ButtonSize>('default');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly className = input('', { alias: 'class' });
  readonly pressed = output<MouseEvent>();

  get classes(): string {
    return cn(
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all',
      'disabled:pointer-events-none disabled:opacity-50 focus-ring',
      this.variantClasses(),
      this.sizeClasses(),
      this.className(),
    );
  }

  private variantClasses(): string {
    const map: Record<ButtonVariant, string> = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border bg-card text-foreground hover:bg-muted',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-muted hover:text-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    };
    return map[this.variant()];
  }

  private sizeClasses(): string {
    const map: Record<ButtonSize, string> = {
      default: 'h-9 px-4 py-2',
      sm: 'h-8 px-3 text-xs',
      lg: 'h-10 px-6',
      icon: 'size-9',
    };
    return map[this.size()];
  }
}
