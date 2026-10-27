import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="status-badge" [class.status-badge--neutral]="tone() === 'neutral'" [class.status-badge--info]="tone() === 'info'" [class.status-badge--success]="tone() === 'success'" [class.status-badge--warning]="tone() === 'warning'" [class.status-badge--danger]="tone() === 'danger'">{{ label() }}</span>`
})
export class StatusBadge {
  readonly label = input<string>('');
  readonly tone = input<BadgeTone>('neutral');
}
