import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthPageShellComponent } from '../components/auth-page-shell.component';
import { PatientRegisterFormComponent } from '../components/patient-register-form.component';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [AuthPageShellComponent, PatientRegisterFormComponent],
  template: `
    <app-auth-page-shell [wide]="true">
      <app-patient-register-form (backToLogin)="goToLogin()" />
    </app-auth-page-shell>
  `,
})
export class RegisterPageComponent {
  private readonly router = inject(Router);

  goToLogin(): void {
    void this.router.navigate(['/auth/login']);
  }
}
