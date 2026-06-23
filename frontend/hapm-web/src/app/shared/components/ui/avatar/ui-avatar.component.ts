import { Component, input } from '@angular/core';
import { cn } from '../../../utils/cn';

@Component({
  selector: 'app-ui-avatar',
  standalone: true,
  template: `
    <div [class]="classes" [title]="name()">
      @if (imageUrl()) {
        <img [src]="imageUrl()" [alt]="name()" class="size-full rounded-full object-cover" />
      } @else {
        {{ initials() }}
      }
    </div>
  `,
})
export class UiAvatarComponent {
  readonly name = input('User');
  readonly imageUrl = input<string | null>(null);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly className = input('', { alias: 'class' });

  initials(): string {
    return this.name()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  get classes(): string {
    const sizes = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-12 text-base' };
    return cn(
      'inline-flex items-center justify-center rounded-full bg-primary/10 font-semibold text-primary',
      sizes[this.size()],
      this.className(),
    );
  }
}
