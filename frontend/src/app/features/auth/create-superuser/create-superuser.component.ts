import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ErrorService } from '@app/core/services/error.service';

@Component({
  selector: 'app-create-superuser',
  templateUrl: './create-superuser.component.html',
  styleUrls: ['./create-superuser.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class CreateSuperuserComponent {
  superuserForm: FormGroup;
  submitted = false;
  isLoading = false;

  constructor(
    private authService: AuthService,
    private errorService: ErrorService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.superuserForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(5)]],
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

  onSubmit(): void {
    this.submitted = true;

    this.errorService.clearAllErrors();
    this.errorService.getClientErrors(this.superuserForm);

    if (this.superuserForm.invalid) {
      this.superuserForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.authService.createSuperuser(this.superuserForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.isLoading = false;
        this.submitted = false;
        this.errorService.getServerErrors(error, this.superuserForm);
      },
    });
  }
}
