import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { ErrorService } from '@app/core/services/error.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginForm: FormGroup;
  error: string | null = null;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private errorService: ErrorService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      auto: [false],
    });
  }

  // ERROR HANDLING METHODS

  isFieldInvalid(field: string): boolean {
    return this.errorService.isFieldInvalid(field, this.submitted);
  }

  isFieldValid(field: string): boolean {
    return this.errorService.isFieldValid(field, this.submitted);
  }

  getFieldErrors(field: string): string[] | null {
    return this.errorService.getFieldErrors(field);
  }

  getGeneralErrors(): string[] {
    return this.errorService.getGeneralErrors();
  }

  // END OF ERROR HANDLING METHODS

  get isLoginAuto() {
    return this.loginForm.value.auto;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorService.clearAllErrors();
    this.errorService.getClientErrors(this.loginForm);

    if (!this.loginForm.value.auto) {
      this.loginForm.get('username')?.markAsTouched();
      this.loginForm.get('password')?.markAsTouched();

      if (this.loginForm.invalid) {
        this.errorService.addGeneralError('Invalid form');
        return;
      }
    }

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.router.navigate(['/tickets']);
      },
      error: (error) => {
        this.errorService.getServerErrors(error, this.loginForm);
      },
    });
  }
}
