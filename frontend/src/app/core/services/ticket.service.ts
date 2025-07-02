import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { Ticket, TicketCreateRequest, TicketUpdateRequest } from '@core/interfaces/ticket.interface';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private apiUrl = `${environment.backendUrl}/tickets`;

  constructor(private http: HttpClient) {}

  getTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/`);
  }

  getTicket(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/${id}/`);
  }

  createTicket(ticket: TicketCreateRequest): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.apiUrl}/`, ticket);
  }

  updateTicket(id: number, ticket: TicketUpdateRequest): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.apiUrl}/${id}/`, ticket);
  }

  deleteTicket(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }
}
