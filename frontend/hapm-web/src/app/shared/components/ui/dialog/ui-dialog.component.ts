import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-ui-dialog',
  standalone: true,
  imports: [],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" (click)="close.emit()"></div>
        <div class="relative z-10 w-full max-h-[90vh] overflow-y-auto rounded-xl border bg-card shadow-xl" [class]="sizeClass()">
          <div class="flex items-center justify-between border-b px-5 py-4">
            <h2 class="text-lg font-semibold">{{ title() }}</h2>
            <button type="button" class="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" (click)="close.emit()">✕</button>
          </div>
          <div class="p-5">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
})
export class UiDialogComponent {
  readonly open = input(false);
  readonly title = input('Dialog');
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly close = output<void>();

  sizeClass(): string {
    const map = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
    return map[this.size()];
  }
}
