export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SAMPLE_COLLECTED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Booking {
  id: string;
  patientId?: string;
  pendingPatientPhone?: string;
  pendingPatientEmail?: string;
  testName: string;
  testCategory?: string;
  appointmentAt?: string;
  patientNotes?: string;
  labNotes?: string;
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
  patientNotes?: string;
}
