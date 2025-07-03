import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TicketService } from './ticket.service';
import { Ticket, TicketCreateRequest, TicketUpdateRequest } from '@core/interfaces/ticket.interface';
import { TicketStatus } from '@core/enums';
import { environment } from '@environments/environment';

describe('TicketService', () => {
  let service: TicketService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.backendUrl}/tickets`;

  const mockTicket: Ticket = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Ticket',
    description: 'This is a test ticket description',
    status: TicketStatus.OPEN,
    user: 'testuser',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };

  const mockTickets: Ticket[] = [
    mockTicket,
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Another Ticket',
      description: 'Another test ticket description',
      status: TicketStatus.IN_PROGRESS,
      user: 'testuser',
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TicketService]
    });
    service = TestBed.inject(TicketService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTickets', () => {
    it('should fetch all tickets', () => {
      service.getTickets().subscribe(tickets => {
        expect(tickets).toEqual(mockTickets);
        expect(tickets.length).toBe(2);
      });

      const req = httpMock.expectOne(`${apiUrl}/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTickets);
    });

    it('should handle empty ticket list', () => {
      service.getTickets().subscribe(tickets => {
        expect(tickets).toEqual([]);
        expect(tickets.length).toBe(0);
      });

      const req = httpMock.expectOne(`${apiUrl}/`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('getTicket', () => {
    it('should fetch a single ticket by id', () => {
      const ticketId = '123e4567-e89b-12d3-a456-426614174000';

      service.getTicket(ticketId).subscribe(ticket => {
        expect(ticket).toEqual(mockTicket);
      });

      const req = httpMock.expectOne(`${apiUrl}/${ticketId}/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTicket);
    });

    it('should handle 404 error when ticket not found', () => {
      const ticketId = 'non-existent-id';

      service.getTicket(ticketId).subscribe({
        next: () => fail('Expected error'),
        error: error => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${ticketId}/`);
      expect(req.request.method).toBe('GET');
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createTicket', () => {
    it('should create a new ticket', () => {
      const newTicket: TicketCreateRequest = {
        title: 'New Ticket',
        description: 'New ticket description'
      };

      const createdTicket: Ticket = {
        ...mockTicket,
        title: newTicket.title,
        description: newTicket.description
      };

      service.createTicket(newTicket).subscribe(ticket => {
        expect(ticket).toEqual(createdTicket);
      });

      const req = httpMock.expectOne(`${apiUrl}/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newTicket);
      req.flush(createdTicket);
    });

    it('should handle validation errors', () => {
      const invalidTicket: TicketCreateRequest = {
        title: 'AB', // Too short
        description: 'Short' // Too short
      };

      service.createTicket(invalidTicket).subscribe({
        next: () => fail('Expected error'),
        error: error => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/`);
      expect(req.request.method).toBe('POST');
      req.flush('Validation error', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateTicket', () => {
    it('should update an existing ticket', () => {
      const ticketId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData: TicketUpdateRequest = {
        title: 'Updated Ticket',
        description: 'Updated description',
        status: TicketStatus.IN_PROGRESS
      };

      const updatedTicket: Ticket = {
        ...mockTicket,
        ...updateData
      };

      service.updateTicket(ticketId, updateData).subscribe(ticket => {
        expect(ticket).toEqual(updatedTicket);
      });

      const req = httpMock.expectOne(`${apiUrl}/${ticketId}/`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush(updatedTicket);
    });
  });

  describe('partialUpdateTicket', () => {
    it('should partially update an existing ticket', () => {
      const ticketId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = { status: TicketStatus.RESOLVED };

      const updatedTicket: Ticket = {
        ...mockTicket,
        status: TicketStatus.RESOLVED
      };

      service.partialUpdateTicket(ticketId, updateData).subscribe(ticket => {
        expect(ticket).toEqual(updatedTicket);
      });

      const req = httpMock.expectOne(`${apiUrl}/${ticketId}/`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateData);
      req.flush(updatedTicket);
    });
  });

  describe('deleteTicket', () => {
    it('should delete a ticket', () => {
      const ticketId = '123e4567-e89b-12d3-a456-426614174000';

      service.deleteTicket(ticketId).subscribe(response => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne(`${apiUrl}/${ticketId}/`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle error when trying to delete closed ticket', () => {
      const ticketId = '123e4567-e89b-12d3-a456-426614174000';

      service.deleteTicket(ticketId).subscribe({
        next: () => fail('Expected error'),
        error: error => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${ticketId}/`);
      expect(req.request.method).toBe('DELETE');
      req.flush('Cannot delete closed ticket', { status: 400, statusText: 'Bad Request' });
    });
  });

    describe('ticket change notification', () => {
    it('should notify when ticket changes', () => {
      const changedTicket: Ticket = { ...mockTicket, status: TicketStatus.RESOLVED };

      service.notifyTicketChanged(changedTicket);

      service.ticketChanged$.subscribe(ticket => {
        expect(ticket).toEqual(changedTicket);
      });
    });

    it('should reset notification', () => {
      service.ticketChanged$.subscribe(ticket => {
        expect(ticket).toBeNull();
      });

      service.resetNotifyTicketChanged();
    });
  });
});
