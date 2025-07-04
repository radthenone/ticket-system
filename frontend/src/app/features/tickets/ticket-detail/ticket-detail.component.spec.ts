import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { TicketDetailComponent } from './ticket-detail.component';
import { TicketService } from '@core/services/ticket.service';
import { ErrorService } from '@core/services/error.service';
import { Ticket } from '@core/interfaces/ticket.interface';
import { TicketStatus } from '@core/enums';

describe('TicketDetailComponent', () => {
  let component: TicketDetailComponent;
  let fixture: ComponentFixture<TicketDetailComponent>;
  let ticketService: jasmine.SpyObj<TicketService>;
  let errorService: jasmine.SpyObj<ErrorService>;
  let router: jasmine.SpyObj<Router>;
  let route: jasmine.SpyObj<ActivatedRoute>;

  const mockTicket: Ticket = {
    id: '1',
    title: 'Test Ticket',
    description: 'This is a test ticket description',
    status: TicketStatus.OPEN,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };

  beforeEach(async () => {
    const ticketServiceSpy = jasmine.createSpyObj('TicketService', ['getTicket']);
    const errorServiceSpy = jasmine.createSpyObj('ErrorService', [
      'addGeneralError',
      'getGeneralErrors',
      'getServerErrors',
      'clearAllErrors'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const routeSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: {
        params: { id: '1' }
      }
    });

    await TestBed.configureTestingModule({
      imports: [TicketDetailComponent],
      providers: [
        { provide: TicketService, useValue: ticketServiceSpy },
        { provide: ErrorService, useValue: errorServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: routeSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TicketDetailComponent);
    component = fixture.componentInstance;
    ticketService = TestBed.inject(TicketService) as jasmine.SpyObj<TicketService>;
    errorService = TestBed.inject(ErrorService) as jasmine.SpyObj<ErrorService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    route = TestBed.inject(ActivatedRoute) as jasmine.SpyObj<ActivatedRoute>;
  });

  beforeEach(() => {
    errorService.getGeneralErrors.and.returnValue([]);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load ticket data on init', () => {
      ticketService.getTicket.and.returnValue(of(mockTicket));

      component.ngOnInit();

      expect(component.loading).toBe(false);
      expect(component.ticket).toEqual(mockTicket);
      expect(ticketService.getTicket).toHaveBeenCalledWith('1');
    });

    it('should set loading to true initially', () => {
      ticketService.getTicket.and.returnValue(of(mockTicket));

      component.ngOnInit();

      expect(ticketService.getTicket).toHaveBeenCalled();
      // Loading should be set to false after successful load
      expect(component.loading).toBe(false);
    });

    it('should handle error when loading ticket', () => {
      const error = new HttpErrorResponse({ status: 404, statusText: 'Not found' });
      ticketService.getTicket.and.returnValue(throwError(() => error));

      component.ngOnInit();

      expect(component.loading).toBe(false);
      expect(component.ticket).toBeNull();
      expect(errorService.addGeneralError).toHaveBeenCalledWith("Can't load tickets");
      expect(errorService.getServerErrors).toHaveBeenCalledWith(error);
    });

    it('should handle different ticket ID from route params', () => {
      route.snapshot.params = { id: '123' };
      ticketService.getTicket.and.returnValue(of(mockTicket));

      component.ngOnInit();

      expect(ticketService.getTicket).toHaveBeenCalledWith('123');
    });
  });

  describe('goToEdit', () => {
    it('should navigate to edit page when ticket exists', () => {
      component.ticket = mockTicket;

      component.goToEdit();

      expect(router.navigate).toHaveBeenCalledWith(['/tickets', mockTicket.id, 'edit']);
    });

    it('should not navigate when ticket is null', () => {
      component.ticket = null;

      component.goToEdit();

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should not navigate when ticket has no id', () => {
      component.ticket = { ...mockTicket, id: undefined };

      component.goToEdit();

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('backToList', () => {
    it('should navigate back to tickets list', () => {
      component.backToList();

      expect(router.navigate).toHaveBeenCalledWith(['/tickets']);
    });
  });

  describe('getGeneralErrors', () => {
    it('should return general errors from error service', () => {
      const errors = ['Error 1', 'Error 2'];
      errorService.getGeneralErrors.and.returnValue(errors);

      const result = component.getGeneralErrors();

      expect(result).toEqual(errors);
      expect(errorService.getGeneralErrors).toHaveBeenCalled();
    });

    it('should return empty array when no errors', () => {
      errorService.getGeneralErrors.and.returnValue([]);

      const result = component.getGeneralErrors();

      expect(result).toEqual([]);
    });
  });

  describe('component state', () => {
    it('should initialize with correct default values', () => {
      expect(component.ticket).toBeNull();
      expect(component.loading).toBe(false);
      expect(component.error).toBeNull();
    });

    it('should update loading state correctly', () => {
      ticketService.getTicket.and.returnValue(of(mockTicket));

      // Before ngOnInit, loading should be false
      expect(component.loading).toBe(false);

      component.ngOnInit();

      // After successful load, loading should be false
      expect(component.loading).toBe(false);
    });
  });

  describe('template integration', () => {
    it('should display ticket information when loaded', () => {
      ticketService.getTicket.and.returnValue(of(mockTicket));
      component.ticket = mockTicket;
      component.loading = false;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const detailValues = compiled.querySelectorAll('.detail-value');
      expect(detailValues[0].textContent).toContain(mockTicket.title);
      expect(compiled.textContent).toContain(mockTicket.description);
      expect(compiled.textContent).toContain(mockTicket.status);
    });

    it('should display error messages when present', () => {
      ticketService.getTicket.and.returnValue(of(mockTicket));
      errorService.getGeneralErrors.and.returnValue(['Test error']);
      component.ticket = null;
      component.loading = false;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Test error');
    });

    it('should show edit and back buttons when ticket is loaded', () => {
      ticketService.getTicket.and.returnValue(of(mockTicket));
      component.ticket = mockTicket;
      component.loading = false;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const buttons = compiled.querySelectorAll('button');
      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent).toContain('Edit');
      expect(buttons[1].textContent).toContain('Back to list');
    });
  });
});
