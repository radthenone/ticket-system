import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { ErrorService } from '@core/services/error.service';
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
      username: ['', [Validators.required]], // Dodano walidator
      password: ['', [Validators.required]], // Dodano walidator
      auto: [false],
    });
  }

  getFieldError(field: string) {
    return this.errorService.getFieldError(field);
  }

  get otherErrors() {
    return this.errorService.getFormErrors(this.loginForm);
  }

  get isLoginAuto() {
    return this.loginForm.value.auto;
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = null;

    if (!this.loginForm.value.auto) {
      this.loginForm.get('username')?.markAsTouched();
      this.loginForm.get('password')?.markAsTouched();

      if (this.loginForm.invalid) {
        this.error = 'Proszę wypełnić wszystkie wymagane pola';
        return;
      }
    }

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.router.navigate(['/tickets']);
      },
      error: (err) => {
        this.errorService.handleServerErrors(this.loginForm, err);
      }
    });
  }
}

