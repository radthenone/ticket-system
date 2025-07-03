import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isLoggedIn: boolean = false;
  success: string | null = null;
  error: string | null = null;
  isLoadingSuperuser: boolean = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.isLoggedIn = !!user;
    });
    this.createSuperuser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isTicketsPage(): boolean {
    return this.router.url === '/tickets';
  }

  goToTickets(): void {
    this.router.navigate(['/tickets']);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  goToCreateSuperuser(): void {
    this.router.navigate(['/auth/create-superuser']);
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }

  createSuperuser(): void {
    this.isLoadingSuperuser = true;
    this.authService.createSuperuser().subscribe({
      next: () => {
        this.isLoadingSuperuser = false;
        this.success =
          "Superuser admin with username 'admin' and password 'admin' was created you can login with this credentials";
      },
      error: (err) => {
        this.isLoadingSuperuser = false;
        this.error =
          "Superuser admin with username 'admin' and password 'admin' already exists you can login with this credentials";
        console.log(this.error);
      },
    });
  }
}
