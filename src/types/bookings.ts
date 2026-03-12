export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SAMPLE_COLLECTED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Booking {
  id: string;
  patientPhone?: string;
  patientEmail?: string;
  testName: string;
  testCategory?: string;
  appointmentAt?: string;
  notes?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  patientPhone?: string;
  patientEmail?: string;
  testName: string;
  testCategory?: string;
  appointmentAt?: string;
  notes?: string;
}
