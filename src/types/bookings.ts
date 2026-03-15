export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SAMPLE_COLLECTED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type PaymentStatus = "UNPAID" | "PAID" | "WAIVED";
export type PaymentMethod = "CASH" | "POS" | "BANK_TRANSFER" | "ONLINE";

export interface Booking {
  id: string;
  patientId?: string;
  pendingPatientPhone?: string;
  pendingPatientEmail?: string;
  testMenuItemId?: string;
  testName: string;
  testCategory?: string;
  appointmentAt?: string;
  patientNotes?: string;
  labNotes?: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  amountKobo?: number;
  paidAt?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MarkPaidRequest {
  paymentMethod: PaymentMethod;
  amountKobo?: number;
}

export interface CreateBookingRequest {
  patientPhone?: string;
  patientEmail?: string;
  testName: string;
  testCategory?: string;
  appointmentAt?: string;
  patientNotes?: string;
}
