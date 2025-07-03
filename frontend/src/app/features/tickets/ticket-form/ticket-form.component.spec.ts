import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { TicketFormComponent } from './ticket-form.component';
import { TicketService } from '@core/services/ticket.service';
import { ErrorService } from '@core/services/error.service';
import { Ticket } from '@core/interfaces/ticket.interface';
import { TicketStatus } from '@core/enums';

describe('TicketFormComponent', () => {
  let component: TicketFormComponent;
  let fixture: ComponentFixture<TicketFormComponent>;
  let ticketService: jasmine.SpyObj<TicketService>;
  let errorService: jasmine.SpyObj<ErrorService>;
  let router: jasmine.SpyObj<Router>;
  let route: jasmine.SpyObj<ActivatedRoute>;

  const mockTicket: Ticket = {
    id: '1',
    title: 'Test Ticket',
    description: 'Test Description',
    status: TicketStatus.OPEN,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };

  beforeEach(async () => {
    const ticketServiceSpy = jasmine.createSpyObj('TicketService', [
      'getTicket',
      'createTicket',
      'updateTicket',
      'partialUpdateTicket',
      'notifyTicketChanged'
    ]);

    const errorServiceSpy = jasmine.createSpyObj('ErrorService', [
      'clearAllErrors',
      'addGeneralError',
      'getGeneralErrors',
      'getServerErrors',
      'getClientErrors',
      'isFieldInvalid',
      'isFieldValid',
      'getFieldErrors'
    ]);

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    const routeSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: {
        data: { mode: 'create' },
        params: { id: '1' }
      }
    });

    await TestBed.configureTestingModule({
      imports: [TicketFormComponent, ReactiveFormsModule],
      providers: [
        { provide: TicketService, useValue: ticketServiceSpy },
        { provide: ErrorService, useValue: errorServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: routeSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TicketFormComponent);
    component = fixture.componentInstance;
    ticketService = TestBed.inject(TicketService) as jasmine.SpyObj<TicketService>;
    errorService = TestBed.inject(ErrorService) as jasmine.SpyObj<ErrorService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    route = TestBed.inject(ActivatedRoute) as jasmine.SpyObj<ActivatedRoute>;
  });

  beforeEach(() => {
    errorService.getGeneralErrors.and.returnValue([]);
    errorService.getFieldErrors.and.returnValue([]);
    errorService.isFieldInvalid.and.returnValue(false);
    errorService.isFieldValid.and.returnValue(false);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize form for create mode', () => {
      route.snapshot.data = { mode: 'create' };

      component.ngOnInit();

      expect(component.editMode).toBe(false);
      expect(component.availableStatuses).toEqual([TicketStatus.OPEN]);
    });

    it('should initialize form for edit mode and load ticket data', () => {
      route.snapshot.data = { mode: 'edit' };
      route.snapshot.params = { id: '1' };
      ticketService.getTicket.and.returnValue(of(mockTicket));

      component.ngOnInit();

      expect(component.editMode).toBe(true);
      expect(component.ticketId).toBe('1');
      expect(ticketService.getTicket).toHaveBeenCalledWith('1');
    });
  });

  describe('loadTicketData', () => {
    beforeEach(() => {
      component.ticketId = '1';
    });

    it('should load ticket data successfully', () => {
      ticketService.getTicket.and.returnValue(of(mockTicket));

      component['loadTicketData']();

      expect(ticketService.getTicket).toHaveBeenCalledWith('1');
      expect(component.ticketForm.get('title')?.value).toBe(mockTicket.title);
      expect(component.ticketForm.get('description')?.value).toBe(mockTicket.description);
      expect(component.ticketForm.get('status')?.value).toBe(mockTicket.status);
    });

    it('should handle error when loading ticket data', () => {
      const error = new HttpErrorResponse({ status: 404, statusText: 'Not found' });
      ticketService.getTicket.and.returnValue(throwError(() => error));

      component['loadTicketData']();

      expect(errorService.addGeneralError).toHaveBeenCalledWith("Can't load ticket data");
    });
  });

  describe('updateAvailableStatuses', () => {
    it('should set available statuses for OPEN ticket', () => {
      component['updateAvailableStatuses'](TicketStatus.OPEN);

      expect(component.availableStatuses).toEqual([
        TicketStatus.OPEN,
        TicketStatus.IN_PROGRESS,
        TicketStatus.CLOSED
      ]);
    });

    it('should set available statuses for IN_PROGRESS ticket', () => {
      component['updateAvailableStatuses'](TicketStatus.IN_PROGRESS);

      expect(component.availableStatuses).toEqual([
        TicketStatus.IN_PROGRESS,
        TicketStatus.RESOLVED,
        TicketStatus.OPEN
      ]);
    });

    it('should set available statuses for RESOLVED ticket', () => {
      component['updateAvailableStatuses'](TicketStatus.RESOLVED);

      expect(component.availableStatuses).toEqual([
        TicketStatus.RESOLVED,
        TicketStatus.CLOSED,
        TicketStatus.IN_PROGRESS
      ]);
    });

    it('should disable form for CLOSED ticket', () => {
      component['updateAvailableStatuses'](TicketStatus.CLOSED);

      expect(component.availableStatuses).toEqual([TicketStatus.CLOSED]);
      expect(component.ticketForm.disabled).toBe(true);
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      component.ticketForm.patchValue({
        title: 'Test Title',
        description: 'Test Description',
        status: TicketStatus.OPEN
      });
    });

    it('should create new ticket in create mode', () => {
      component.editMode = false;
      ticketService.createTicket.and.returnValue(of(mockTicket));

      component.onSubmit();

      expect(ticketService.createTicket).toHaveBeenCalledWith({
        title: 'Test Title',
        description: 'Test Description'
      });
      expect(router.navigate).toHaveBeenCalledWith(['/tickets']);
    });

    it('should update ticket in edit mode', () => {
      component.editMode = true;
      component.ticketId = '1';
      ticketService.updateTicket.and.returnValue(of(mockTicket));

      component.onSubmit();

      expect(ticketService.updateTicket).toHaveBeenCalledWith('1', {
        title: 'Test Title',
        description: 'Test Description',
        status: TicketStatus.OPEN
      });
      expect(router.navigate).toHaveBeenCalledWith(['/tickets']);
    });

    it('should use partial update when form is dirty', () => {
      component.editMode = true;
      component.ticketId = '1';
      component.ticketForm.markAsDirty();
      ticketService.partialUpdateTicket.and.returnValue(of(mockTicket));

      component.onSubmit();

      expect(ticketService.partialUpdateTicket).toHaveBeenCalledWith('1', {
        title: 'Test Title',
        description: 'Test Description',
        status: TicketStatus.OPEN
      });
    });

    it('should notify ticket changed when status changes', () => {
      component.editMode = true;
      component.ticketId = '1';
      component['originalStatus'] = TicketStatus.OPEN;
      component.ticketForm.patchValue({ status: TicketStatus.IN_PROGRESS });

      const updatedTicket = { ...mockTicket, status: TicketStatus.IN_PROGRESS };
      ticketService.updateTicket.and.returnValue(of(updatedTicket));

      component.onSubmit();

      expect(ticketService.notifyTicketChanged).toHaveBeenCalledWith(updatedTicket);
    });

    it('should handle invalid form', () => {
      component.ticketForm.patchValue({
        title: '', // Invalid
        description: 'Test Description',
        status: TicketStatus.OPEN
      });
      component.ticketForm.get('title')?.setErrors({ required: true });

      component.onSubmit();

      expect(errorService.addGeneralError).toHaveBeenCalledWith('Please fill all required fields correctly');
      expect(ticketService.createTicket).not.toHaveBeenCalled();
    });

    it('should handle server error', () => {
      const error = new HttpErrorResponse({ status: 400, statusText: 'Bad request' });
      ticketService.createTicket.and.returnValue(throwError(() => error));

      component.onSubmit();

      expect(errorService.getServerErrors).toHaveBeenCalledWith(error, component.ticketForm);
    });
  });

  describe('backToList', () => {
    it('should navigate back to tickets list', () => {
      component.backToList();

      expect(router.navigate).toHaveBeenCalledWith(['/tickets']);
    });
  });

  describe('isTicketClosed', () => {
    it('should return true when original status is CLOSED', () => {
      component['originalStatus'] = TicketStatus.CLOSED;

      expect(component.isTicketClosed).toBe(true);
    });

    it('should return false when original status is not CLOSED', () => {
      component['originalStatus'] = TicketStatus.OPEN;

      expect(component.isTicketClosed).toBe(false);
    });

    it('should return false when original status is null', () => {
      component['originalStatus'] = null;

      expect(component.isTicketClosed).toBe(false);
    });
  });

  describe('error handling methods', () => {
    it('should call error service methods', () => {
      component.isFieldInvalid('title');
      component.isFieldValid('title');
      component.getFieldErrors('title');
      component.getGeneralErrors();

      expect(errorService.isFieldInvalid).toHaveBeenCalledWith('title', component.submitted);
      expect(errorService.isFieldValid).toHaveBeenCalledWith('title', component.submitted);
      expect(errorService.getFieldErrors).toHaveBeenCalledWith('title');
      expect(errorService.getGeneralErrors).toHaveBeenCalled();
    });
  });
});
