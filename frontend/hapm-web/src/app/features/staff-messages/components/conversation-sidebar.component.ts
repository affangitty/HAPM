import { Component, input, output } from '@angular/core';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { ConversationThread } from '../models/staff-message.models';

@Component({
  selector: 'app-conversation-sidebar',
  standalone: true,
  imports: [UiEmptyStateComponent],
  template: `
    <div class="flex h-full flex-col border-r bg-card">
      <div class="border-b px-4 py-3">
        <h2 class="font-semibold">Conversations</h2>
        <p class="text-xs text-muted-foreground">Team messaging</p>
      </div>

      <div class="flex-1 overflow-y-auto p-2">
        @if (!threads().length) {
          <app-ui-empty-state title="No conversations" message="Start messaging your team." />
        } @else {
          @for (thread of threads(); track thread.id) {
            <button type="button"
              [class]="'mb-1 w-full rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted ' + (selectedId() === thread.id ? 'bg-primary/10' : '')"
              (click)="select.emit(thread)">
              <div class="flex items-center justify-between gap-2">
                <p class="truncate font-medium">{{ thread.title }}</p>
                @if (thread.unread) {
                  <span class="rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">{{ thread.unread }}</span>
                }
              </div>
              <p class="truncate text-xs text-muted-foreground">{{ thread.subtitle }}</p>
              @if (thread.lastMessage) {
                <p class="mt-1 truncate text-xs text-muted-foreground">{{ thread.lastMessage }}</p>
              }
            </button>
          }
        }
      </div>
    </div>
  `,
})
export class ConversationSidebarComponent {
  readonly threads = input<ConversationThread[]>([]);
  readonly selectedId = input<string | null>(null);
  readonly select = output<ConversationThread>();
}
