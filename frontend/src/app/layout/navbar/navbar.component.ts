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
  username: string | null = null;
  isLoadingSuperuser: boolean = false;
  private created = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.isLoggedIn = !!user;
      this.username = user ? user.username : null;
    });
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
    if (!this.created) {
      this.created = true;
      this.authService.createSuperuser().subscribe({
        next: () => {
          this.isLoadingSuperuser = false;
        },
        error: () => {
          this.isLoadingSuperuser = false;
        },
      });
    }
  }
}
