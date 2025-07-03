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
  private ticketChangedSubject = new BehaviorSubject<Ticket | null>(null);
  ticketChanged$ = this.ticketChangedSubject.asObservable();

  constructor(private http: HttpClient) {}

  notifyTicketChanged(ticket: Ticket | null): void {
    this.ticketChangedSubject.next(ticket);
  }

  getTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/`);
  }

  getTicket(id: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/${id}/`);
  }

  createTicket(ticket: TicketCreateRequest): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.apiUrl}/`, ticket);
  }

  updateTicket(id: string, ticket: TicketUpdateRequest): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.apiUrl}/${id}/`, ticket);
  }

  partialUpdateTicket(id: string, ticket: Partial<TicketUpdateRequest>): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.apiUrl}/${id}/`, ticket);
  }

  deleteTicket(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }
}
