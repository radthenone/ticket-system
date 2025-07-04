import { TicketStatus } from '@core/enums';

export interface Ticket {
  id?: string;
  user?: string;
  title: string;
  description: string;
  status: TicketStatus;
  created_at?: string;
  updated_at?: string;
}

export interface TicketCreateRequest {
  title: string;
  description: string;
}

export interface TicketUpdateRequest {
  title: string;
  description: string;
  status: TicketStatus;
}
