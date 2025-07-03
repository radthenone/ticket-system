import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { TicketListComponent } from './ticket-list.component';
import { TicketService } from '@core/services/ticket.service';
import { ErrorService } from '@core/services/error.service';
import { Ticket } from '@core/interfaces/ticket.interface';
import { TicketStatus } from '@core/enums';

describe('TicketListComponent', () => {
  let component: TicketListComponent;
  let fixture: ComponentFixture<TicketListComponent>;
  let ticketService: jasmine.SpyObj<TicketService>;
  let errorService: jasmine.SpyObj<ErrorService>;
  let router: jasmine.SpyObj<Router>;

  const mockTickets: Ticket[] = [
    {
      id: '1',
      title: 'Test Ticket 1',
      description: 'Description 1',
      status: TicketStatus.OPEN,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    },
    {
      id: '2',
      title: 'Test Ticket 2',
      description: 'Description 2',
      status: TicketStatus.CLOSED,
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z'
    }
  ];

  beforeEach(async () => {
    const ticketServiceSpy = jasmine.createSpyObj('TicketService', [
      'getTickets',
      'deleteTicket',
      'notifyTicketChanged',
      'resetNotifyTicketChanged'
    ], {
      ticketChanged$: of(null)
    });

    const errorServiceSpy = jasmine.createSpyObj('ErrorService', [
      'clearAllErrors',
      'addGeneralError',
      'getGeneralErrors',
      'getServerErrors'
    ]);

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [TicketListComponent],
      providers: [
        { provide: TicketService, useValue: ticketServiceSpy },
        { provide: ErrorService, useValue: errorServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TicketListComponent);
    component = fixture.componentInstance;
    ticketService = TestBed.inject(TicketService) as jasmine.SpyObj<TicketService>;
    errorService = TestBed.inject(ErrorService) as jasmine.SpyObj<ErrorService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    ticketService.getTickets.and.returnValue(of(mockTickets));
    errorService.getGeneralErrors.and.returnValue([]);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should clear errors and load tickets on init', () => {
      component.ngOnInit();

      expect(errorService.clearAllErrors).toHaveBeenCalled();
      expect(ticketService.getTickets).toHaveBeenCalled();
      expect(component.tickets).toEqual(mockTickets);
      expect(component.hasLoaded).toBe(true);
      expect(component.isLoading).toBe(false);
    });

    it('should show error message when no tickets exist', () => {
      ticketService.getTickets.and.returnValue(of([]));

      component.ngOnInit();

      expect(errorService.addGeneralError).toHaveBeenCalledWith('You must first create ticket');
    });

    it('should handle ticket changed notification', () => {
      const changedTicket: Ticket = { ...mockTickets[0], status: TicketStatus.RESOLVED };
      Object.defineProperty(ticketService, 'ticketChanged$', {
        value: of(changedTicket),
        writable: false
      });

      component.ngOnInit();

      expect(component.ticketStatusChangedMessage).toContain('Ticket "Test Ticket 1" status changed to resolved');
    });
  });

  describe('loadTickets', () => {
    it('should load tickets successfully', () => {
      component.loadTickets();

      expect(component.isLoading).toBe(false);
      expect(component.hasLoaded).toBe(true);
      expect(component.tickets).toEqual(mockTickets);
    });

    it('should handle error when loading tickets', () => {
      const error = new HttpErrorResponse({ status: 500, statusText: 'Server error' });
      ticketService.getTickets.and.returnValue(throwError(() => error));

      component.loadTickets();

      expect(component.isLoading).toBe(false);
      expect(component.hasLoaded).toBe(false);
      expect(errorService.getServerErrors).toHaveBeenCalledWith(error);
    });

    it('should not load tickets if already loading', () => {
      component.isLoading = true;
      ticketService.getTickets.calls.reset();

      component.loadTickets();

      expect(ticketService.getTickets).not.toHaveBeenCalled();
    });
  });

  describe('viewTicketDetails', () => {
    it('should navigate to ticket details', () => {
      const ticket = mockTickets[0];

      component.viewTicketDetails(ticket);

      expect(router.navigate).toHaveBeenCalledWith(['/tickets', ticket.id]);
    });

    it('should not navigate if ticket has no id', () => {
      const ticket = { ...mockTickets[0], id: undefined };

      component.viewTicketDetails(ticket);

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('createTicket', () => {
    it('should navigate to create ticket form', () => {
      component.createTicket();

      expect(router.navigate).toHaveBeenCalledWith(['/tickets/new']);
    });
  });

  describe('editTicket', () => {
    it('should navigate to edit ticket form', () => {
      const ticket = mockTickets[0];

      component.editTicket(ticket);

      expect(router.navigate).toHaveBeenCalledWith(['/tickets', ticket.id, 'edit']);
    });

    it('should not navigate if ticket has no id', () => {
      const ticket = { ...mockTickets[0], id: undefined };

      component.editTicket(ticket);

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('deleteTicket', () => {
    beforeEach(() => {
      spyOn(window, 'confirm').and.returnValue(true);
    });

    it('should delete ticket successfully', () => {
      const ticket = mockTickets[0];
      ticketService.deleteTicket.and.returnValue(of(undefined));

      component.tickets = [...mockTickets];
      component.deleteTicket(ticket);

      expect(ticketService.deleteTicket).toHaveBeenCalledWith(ticket.id!);
      expect(component.tickets).not.toContain(ticket);
      expect(component.tickets.length).toBe(1);
    });

    it('should not delete closed ticket', () => {
      const closedTicket = mockTickets[1]; // This has status CLOSED

      component.deleteTicket(closedTicket);

      expect(errorService.addGeneralError).toHaveBeenCalledWith("You can't delete closed tickets");
      expect(ticketService.deleteTicket).not.toHaveBeenCalled();
    });

    it('should not delete if ticket has no id', () => {
      const ticket = { ...mockTickets[0], id: undefined };

      component.deleteTicket(ticket);

      expect(ticketService.deleteTicket).not.toHaveBeenCalled();
    });

    it('should not delete if user cancels confirmation', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      const ticket = mockTickets[0];

      component.deleteTicket(ticket);

      expect(ticketService.deleteTicket).not.toHaveBeenCalled();
    });

    it('should handle delete error', () => {
      const ticket = mockTickets[0];
      const error = new HttpErrorResponse({ status: 400, statusText: 'Cannot delete' });
      ticketService.deleteTicket.and.returnValue(throwError(() => error));

      component.deleteTicket(ticket);

      expect(errorService.getServerErrors).toHaveBeenCalledWith(error);
    });

    it('should show create ticket message when list becomes empty', () => {
      const ticket = mockTickets[0];
      ticketService.deleteTicket.and.returnValue(of(undefined));
      component.tickets = [ticket]; // Only one ticket

      component.deleteTicket(ticket);

      expect(errorService.addGeneralError).toHaveBeenCalledWith('You must first create ticket');
    });
  });

  describe('getGeneralErrors', () => {
    it('should return general errors from error service', () => {
      const errors = ['Error 1', 'Error 2'];
      errorService.getGeneralErrors.and.returnValue(errors);

      const result = component.getGeneralErrors();

      expect(result).toEqual(errors);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subscription', () => {
      component.ngOnInit();
      spyOn(component.subscription!, 'unsubscribe');

      component.ngOnDestroy();

      expect(component.subscription!.unsubscribe).toHaveBeenCalled();
    });

    it('should handle null subscription', () => {
      component.subscription = null;

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
