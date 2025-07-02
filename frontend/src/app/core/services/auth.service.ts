import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable, BehaviorSubject, pipe, tap } from 'rxjs';
import { Credentials, User } from '@app/core/interfaces/auth.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = this.getToken();
    const user = this.getUser();
    if (token && user) {
      this.setUser(user);
    } else {
      this.cleanUser();
    }
  }

  private apiUrl = `${environment.backendUrl}/auth`;

  createSuperuser(
    data?: { username: string; password: string; email: string }
  ): Observable<{ token: string; user: User }> {
    return this.http.post<{ token: string; user: User }>(
      `${this.apiUrl}/create_superuser/`,
      data ?? {}
    );
  }


  login(credentials: Credentials): Observable<{ token: string; user: User }> {
    return this.http.post<{ token: string; user: User }>(`${this.apiUrl}/login/`, credentials).pipe(
      tap((session) => {
        this.setSession(session);
      })
    );
  }

  logout() {
    return this.http.post(`${this.apiUrl}/logout/`, {}).pipe(
      tap(() => {
        this.deleteSession();
      })
    );
  }

  public setSession(session: { token: string; user: User }) {
    localStorage.setItem('token', session.token);
    localStorage.setItem('user', JSON.stringify(session.user));
    this.userSubject.next(session.user);
  }

  public getToken() {
    return localStorage.getItem('token');
  }

  public cleanToken() {
    localStorage.removeItem('token');
  }

  public getUser(): User | null {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  public setUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
    this.userSubject.next(user);
  }

  public cleanUser() {
    localStorage.removeItem('user');
    this.userSubject.next(null);
  }

  public deleteSession() {
    this.cleanToken();
    this.cleanUser();
  }
  public isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
