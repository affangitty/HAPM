import { Component, input, output } from '@angular/core';

export interface UiTabItem<T extends string = string> {
  id: T;
  label: string;
}

@Component({
  selector: 'app-ui-tabs',
  standalone: true,
  template: `
    <div class="flex flex-wrap gap-2" role="tablist" [attr.aria-label]="ariaLabel()">
      @for (tab of tabs(); track tab.id) {
        <button
          type="button"
          role="tab"
          class="rounded-xl px-3 py-2 text-sm font-medium transition-colors"
          [class]="active() === tab.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'"
          [attr.aria-selected]="active() === tab.id"
          (click)="tabChange.emit(tab.id)"
        >
          {{ tab.label }}
        </button>
      }
    </div>
  `,
})
export class UiTabsComponent<T extends string = string> {
  readonly tabs = input.required<UiTabItem<T>[]>();
  readonly active = input.required<T>();
  readonly ariaLabel = input('Sections');
  readonly tabChange = output<T>();
}
