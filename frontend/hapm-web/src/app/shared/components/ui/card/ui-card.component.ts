import { Component, input } from '@angular/core';
import { cn } from '../../../utils/cn';

@Component({
  selector: 'app-ui-card',
  standalone: true,
  template: `<div [class]="classes"><ng-content /></div>`,
})
export class UiCardComponent {
  readonly className = input('', { alias: 'class' });
  get classes(): string {
    return cn('bg-card text-card-foreground flex flex-col gap-6 rounded-xl border', this.className());
  }
}

@Component({
  selector: 'app-ui-card-header',
  standalone: true,
  template: `<div [class]="cn('flex flex-col gap-1.5 px-6 pt-6', className())"><ng-content /></div>`,
})
export class UiCardHeaderComponent {
  readonly className = input('', { alias: 'class' });
  protected readonly cn = cn;
}

@Component({
  selector: 'app-ui-card-title',
  standalone: true,
  template: `<h4 [class]="cn('font-semibold leading-none', className())"><ng-content /></h4>`,
})
export class UiCardTitleComponent {
  readonly className = input('', { alias: 'class' });
  protected readonly cn = cn;
}

@Component({
  selector: 'app-ui-card-description',
  standalone: true,
  template: `<p [class]="cn('text-sm text-muted-foreground', className())"><ng-content /></p>`,
})
export class UiCardDescriptionComponent {
  readonly className = input('', { alias: 'class' });
  protected readonly cn = cn;
}

@Component({
  selector: 'app-ui-card-content',
  standalone: true,
  template: `<div [class]="cn('px-6 pb-6', className())"><ng-content /></div>`,
})
export class UiCardContentComponent {
  readonly className = input('', { alias: 'class' });
  protected readonly cn = cn;
}

@Component({
  selector: 'app-ui-card-footer',
  standalone: true,
  template: `<div [class]="cn('flex items-center px-6 pb-6', className())"><ng-content /></div>`,
})
export class UiCardFooterComponent {
  readonly className = input('', { alias: 'class' });
  protected readonly cn = cn;
}
