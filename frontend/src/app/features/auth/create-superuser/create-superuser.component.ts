import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ErrorService } from '@core/services/error.service';

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

  getFieldError(field: string): string | null {
    const validationError = this.errorService.getValidationErrorMessage(this.superuserForm, field);
    if (validationError) {
      this.errorService.setFieldError(field, validationError);
    }
    return this.errorService.getFieldError(field);
  }

  get otherErrors() {
    return this.errorService.getFormErrors(this.superuserForm);
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.superuserForm.invalid) {
      return;
    }

    this.isLoading = true;

    this.authService.createSuperuser(this.superuserForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        this.submitted = false;
        this.errorService.handleServerErrors(this.superuserForm, err);
      }
    });
  }
}