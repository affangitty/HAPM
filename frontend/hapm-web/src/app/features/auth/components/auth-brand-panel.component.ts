import { Component } from '@angular/core';

@Component({
  selector: 'app-auth-brand-panel',
  standalone: true,
  template: `
    <div
      class="relative flex h-full flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-teal-600 p-12"
    >
      <div
        class="absolute inset-0 opacity-10"
        style="
          background-image:
            radial-gradient(circle at 20% 50%, white 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, white 0%, transparent 30%);
        "
      ></div>

      <div class="z-10 flex items-center gap-3">
        <div class="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
          <svg class="size-5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
          </svg>
        </div>
        <div>
          <p class="text-lg font-bold tracking-tight text-white">HAPM</p>
          <p class="text-xs text-blue-200">Hospital Management Platform</p>
        </div>
      </div>

      <div class="z-10">
        <h1 class="mb-4 text-4xl font-bold leading-tight text-white">
          Healthcare operations,<br />unified and streamlined.
        </h1>
        <p class="max-w-sm text-base leading-relaxed text-blue-200">
          One platform for appointments, EMR, prescriptions, billing, and real-time clinical collaboration.
        </p>

        <div class="mt-10 grid grid-cols-3 gap-6">
          @for (stat of stats; track stat.label) {
            <div>
              <p class="text-2xl font-bold text-white">{{ stat.value }}</p>
              <p class="mt-0.5 text-xs text-blue-200">{{ stat.label }}</p>
            </div>
          }
        </div>
      </div>

      <div class="z-10 flex flex-wrap items-center gap-3">
        @for (badge of badges; track badge) {
          <div class="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5">
            <svg class="size-3 text-blue-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span class="text-[11px] font-medium text-blue-100">{{ badge }}</span>
          </div>
        }
      </div>
    </div>
  `,
})
export class AuthBrandPanelComponent {
  readonly stats = [
    { label: 'Patients', value: '12,400+' },
    { label: 'Doctors', value: '86 Active' },
    { label: 'Appointments', value: '320/day' },
  ];

  readonly badges = ['HIPAA Compliant', 'SOC 2 Type II', 'ISO 27001'];
}
