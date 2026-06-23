import { Component, input } from '@angular/core';
import { StaffMessageDto } from '../models/staff-message.models';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  template: `
    <div class="flex" [class.justify-end]="mine()">
      <div class="max-w-[85%] rounded-2xl px-4 py-2 text-sm" [class]="mine() ? 'bg-primary text-primary-foreground' : 'bg-muted'">
        @if (!mine()) {
          <p class="mb-1 text-xs font-semibold opacity-80">{{ message().senderName }}</p>
        }
        <p class="whitespace-pre-wrap">{{ message().content }}</p>
        <p class="mt-1 text-[10px] opacity-70">{{ formatTime(message().createdAtUtc) }}</p>
      </div>
    </div>
  `,
})
export class MessageBubbleComponent {
  readonly message = input.required<StaffMessageDto>();
  readonly mine = input(false);

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
