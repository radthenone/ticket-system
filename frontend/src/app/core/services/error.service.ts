import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  private currentForm: FormGroup | null = null;
  private serverErrors: Record<string, string[]> = {};
  private clientErrors: Record<string, string[]> = {};
  private generalError: string[] = [];
  private inputErrors: Record<string, string[]> = {};

  constructor() {}

  // @ CSS INVALID FIELDS
  isFieldInvalid(fieldName: string, ...extraFlags: boolean[]): boolean {
    if (!this.currentForm) return false;

    const c = this.currentForm.get(fieldName);
    if (!c) return false;
    const extra = extraFlags.some((f) => f);

    return c.invalid && (c.touched || extra);
  }

  isFieldValid(fieldName: string, ...extraFlags: boolean[]): boolean {
    if (!this.currentForm) return false;

    const c = this.currentForm.get(fieldName);
    if (!c) return false;

    const extra = extraFlags.some((f) => f);

    return c.valid && (c.touched || extra);
  }

  // @ CLEAR METHODS
  /**
   * Clear all errors in the form
   * Clears both server and client errors, as well as general errors.
   */
  clearAllErrors(): void {
    this.serverErrors = {};
    this.clientErrors = {};
    this.generalError = [];
  }

  consoleAllErrors(): void {
    console.log('Server errors:', this.serverErrors);
    console.log('Client errors:', this.clientErrors);
    console.log('General errors:', this.generalError);
  }

  // @ TEMPLATE METHODS
  /**
   * Get all errors for a field (server + client) as string[]
   * First server errors, then client errors
   */
  getFieldErrors(fieldName: string): string[] {
    const errors: string[] = [];

    // First server errors
    if (this.serverErrors[fieldName]) {
      errors.push(...this.serverErrors[fieldName]);
    }

    // Then client errors
    if (this.clientErrors[fieldName]) {
      errors.push(...this.clientErrors[fieldName]);
    }

    return errors;
  }

  /**
   * Get general errors as string[] (may be empty)
   */
  getGeneralErrors(): string[] {
    return this.generalError;
  }

  addGeneralError(errorMessage: string): void {
    if (!this.generalError.includes(errorMessage)) {
      this.generalError.push(errorMessage);
    }
  }

  // @ SERVER ERRORS
  getServerErrors(error: HttpErrorResponse, form?: FormGroup): void {
    this.serverErrors = {};
    this.generalError = [];

    if (error?.error) {
      const data = error.error;

      // 1. Errors like: {"field": ["error"], ...}
      Object.keys(data).forEach((key) => {
        if (Array.isArray(data[key])) {
          this.serverErrors[key] = data[key];

          if (form && form.get(key)) {
            form.get(key)?.setErrors({ server: data[key].join(' ') });
          }

          // add field if field not in form
          if (!form || !form.get(key)) {
            Object.keys(data[key]).forEach((nextKey) => {
              if (!this.generalError.includes(data[key][nextKey])) {
                this.generalError.push(data[key][nextKey]);
              }
            });
            // this.generalError.push(...data[key]);
          }
        } else if (typeof data[key] === 'string') {
          if (form && form.get(key)) {
            form.get(key)?.setErrors({ server: data[key] });
          } else {
            if (!this.generalError.includes(data[key])) {
              this.generalError.push(data[key]);
            }
          }
        }
      });

      // 2. handle errors for specific fields:  {"non_field_errors": ["error"], ...}
      const globalErrorKeys = ['non_field_errors', 'detail', 'error'];
      globalErrorKeys.forEach((key) => {
        if (data[key]) {
          if (Array.isArray(data[key])) {
            Object.keys(data[key]).forEach((nextKey) => {
              if (!this.generalError.includes(data[key][nextKey])) {
                this.generalError.push(data[key][nextKey]);
              }
            });
            // this.generalError.push(...data[key]);
          } else if (typeof data[key] === 'string') {
            if (!this.generalError.includes(data[key])) {
              this.generalError.push(data[key]);
            }
            // this.generalError.push(data[key]);
          }
        }
      });
      // Nostandards error handling ->>

      // 3. Nostandards: {"message": "..."}
      if (typeof data.message === 'string') {
        if (!this.generalError.includes(data.message)) {
          this.generalError.push(data.message);
        }
      }
    } else if (error?.status === 0) {
      if (!this.generalError.includes('Server connect error')) {
        this.generalError.push('Server connect error');
      }
    } else {
      if (!this.generalError.includes('Invalid error')) {
        this.generalError.push('Invalid error');
      }
    }

    // Console all errors
    this.consoleAllErrors();
  }

  getServerErrorsForField(field: string): { message: string }[] {
    if (!this.serverErrors[field]) return [];
    return this.serverErrors[field].map((msg) => ({ message: msg }));
  }

  clearServerErrors(): void {
    this.serverErrors = {};
    this.generalError = [];
  }

  getGeneralError(): string[] {
    return this.generalError;
  }

  clearGeneralError(): void {
    this.generalError = [];
  }

  // @ CLIENT ERRORS
  private getClientMessages(
    errorType: any,
    errorValue: any
  ): {
    message: string;
  } {
    switch (errorType) {
      case 'required':
        return { message: 'This field is required.' };
      case 'email':
        return { message: 'Invalid email format.' };
      case 'minlength':
      case 'minLength':
        return {
          message: `Minimum length is ${errorValue?.requiredLength || 8}.`,
        };
      case 'maxlength':
      case 'maxLength':
        return {
          message: `Maximum length is ${errorValue?.requiredLength || 20}.`,
        };
      case 'pattern':
        return { message: 'Pattern mismatch.' };
      case 'passwordMismatch':
      case 'passwordsDontMatch':
        return { message: 'Passwords do not match.' };
      case 'upperCase':
        return { message: 'At least one uppercase letter is required.' };
      case 'lowerCase':
        return { message: 'At least one lowercase letter is required.' };
      case 'digit':
        return { message: 'At least one number is required.' };
      case 'specialChar':
        return { message: 'At least one special character is required.' };
      default:
        return { message: `Validation error: ${errorType}` };
    }
  }

  getClientErrors(form: FormGroup, field?: string): void {
    this.currentForm = form;
    if (field) {
      const control = form.get(field);
      if (control && control.errors) {
        this.clientErrors[field] = [];

        Object.entries(control.errors).forEach(([errorType, errorValue]) => {
          const clientMessage = this.getClientMessages(errorType, errorValue);
          this.clientErrors[field].push(clientMessage.message);
        });
      }
    } else {
      Object.keys(form.controls).forEach((fieldName) => {
        const control = form.get(fieldName);
        if (control && control.errors) {
          this.clientErrors[fieldName] = [];

          Object.entries(control.errors).forEach(([errorType, errorValue]) => {
            const clientMessage = this.getClientMessages(errorType, errorValue);
            this.clientErrors[fieldName].push(clientMessage.message);
          });
        }
      });
    }
  }

  getClientErrorsForField(field: string): { message: string }[] {
    if (!this.clientErrors[field]) return [];
    return this.clientErrors[field].map((msg) => ({ message: msg }));
  }

  clearClientErrors(): void {
    this.clientErrors = {};
  }

  /* // @ HOW TO USE INPUT ERRORS
  How to use:
  username = '';
  this.errorService.validateInput('username', this.username, {
    required: true,
    minLength: 3,
    maxLength: 20
  });

  <input
    name="username"
    [value]="username"
    (input)="onUsernameChange($event.target.value)"
    placeholder="Add username"
  />

  <div *ngIf="errorService.getInputErrors('username')">
    <div *ngFor="let error of errorService.getInputErrors('username')" class="error">
      {{ error }}
    </div>
  </div>
  */
  validateInput(inputName: string, value: string, rules: any = {}): void {
    const errors: string[] = [];

    // Required
    if (rules.required && (!value || value.trim() === '')) {
      errors.push(this.getClientMessages('required', null).message);
    }

    // Email
    if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.push(this.getClientMessages('email', null).message);
    }

    // Min Length
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(this.getClientMessages('minLength', { requiredLength: rules.minLength }).message);
    }

    // Max Length
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(this.getClientMessages('maxLength', { requiredLength: rules.maxLength }).message);
    }

    // Pattern
    if (rules.pattern && value && !rules.pattern.test(value)) {
      errors.push(this.getClientMessages('pattern', null).message);
    }

    if (errors.length > 0) {
      this.inputErrors[inputName] = errors;
    } else {
      delete this.inputErrors[inputName];
    }
  }

  getInputErrors(inputName: string): string[] | null {
    const errors = this.inputErrors[inputName];
    return errors && errors.length > 0 ? errors : null;
  }

  clearInputErrors(inputName: string): void {
    delete this.inputErrors[inputName];
  }

  clearAllInputErrors(): void {
    this.inputErrors = {};
  }

  /* //@ HOW TO USE SERVICE ERRORS
  onSubmit() {
  // Clean all errors
  this.errorService.clearFormErrors();

  // Client errors to all
  this.errorService.getClientErrors(this.form);

  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  this.apiService.submit(this.form.value).subscribe({
    error: (err) => this.errorService.getServerErrors(err, this.form)
  });
  }

  // to specyfic client field error
  onFieldChange(fieldName: string) {
    this.errorService.getClientErrors(this.form, fieldName);
  }

  <form [formGroup]="form" (ngSubmit)="onSubmit()">
  <!-- Ogólne błędy -->
  <div *ngIf="errorService.getGeneralErrors()">
    <div *ngFor="let error of errorService.getGeneralErrors()" class="general-error">
      {{ error }}
    </div>
  </div>

  <!-- username -->
  <div>
    <label>Username:</label>
    <input formControlName="username" />
    <div *ngIf="errorService.getFieldErrors('username')">
      <div *ngFor="let error of errorService.getFieldErrors('username')" class="field-error">
        {{ error }}
      </div>
    </div>
  </div>

  <button type="submit">Submit</button>
</form>

  */
}
