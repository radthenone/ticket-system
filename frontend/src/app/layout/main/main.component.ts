import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
})
export class MainComponent implements OnInit {
  isLoggedIn = false;
  adminMessage: string | null = "Superuser admin with username 'admin' and password 'admin' already exists you can login with this credentials";
  isLoadingSuperuser: boolean = false;
  created = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.isLoggedIn = !!user;
    });
    this.createSuperuser();
  }

  createSuperuser(): void {
    this.isLoadingSuperuser = true;
    if (!this.created) {
      this.created = true;
      this.authService.createSuperuser().subscribe({
        next: () => {
          this.isLoadingSuperuser = false;
          this.adminMessage = "Superuser admin with username 'admin' and password 'admin' was created you can login with this credentials";
        },
        error: () => {
          this.isLoadingSuperuser = false;
        },
      });
    }
  }
}
