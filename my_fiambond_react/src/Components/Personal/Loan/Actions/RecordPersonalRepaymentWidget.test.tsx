// --- STEP 1: DEFINE FETCH GLOBALLY ---
const mockFetch = jest.fn();
global.fetch = mockFetch;

// --- STEP 2: MOCK THE FIREBASE LIBRARIES ---
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  onSnapshot: jest.fn()
}));

// --- STEP 3: MOCK CONFIG ---
jest.mock('../../../../config/firebase-config', () => ({
  auth: { currentUser: { uid: 'creditor123' } },
  db: {}
}));

// --- STEP 4: MOCK TOAST ---
jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn()
  }
}));

// --- STEP 5: IMPORTS ---
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecordPersonalRepaymentWidget from './RecordPersonalRepaymentWidget';
import { AppContext } from '../../../../Context/AppContext'; 
import '@testing-library/jest-dom';

// --- STEP 6: HELPER & MOCKS ---
const mockUser = { uid: 'creditor123', email: 'creditor@test.com', full_name: 'Creditor Test' };
const mockOnSuccess = jest.fn();

const renderWidget = (loanData: any) => {
  return render(
    <AppContext.Provider value={{ user: mockUser } as any}>
      <RecordPersonalRepaymentWidget loan={loanData} onSuccess={mockOnSuccess} />
    </AppContext.Provider>
  );
};

describe('RecordPersonalRepaymentWidget Tests', () => {
  
  beforeEach(() => {
    mockFetch.mockClear();
    mockOnSuccess.mockClear();
  });

  // --- TEST CASE 1: INPUT DEFAULT STATE ---
  // NOTE: This will fail until you update your Component's useState to be empty!
  it('should initialize amount input as empty (not pre-filled)', () => {
    const loan = {
      id: 'loan_abc',
      total_owed: 5000,
      repaid_amount: 0,
      debtor: { full_name: 'John Doe' }
    };

    renderWidget(loan);

    const input = screen.getByLabelText(/Amount Received/i) as HTMLInputElement;
    // If your component defaults to total_owed, this expects '' and will fail.
    // To make this pass, fix your component, OR change this to: expect(input.value).toBe('5000');
    expect(input.value).toBe(''); 
  });

  // --- TEST CASE 2: PARTIAL PAYMENT & TRANSACTION LOGGING ---
  it('should process a partial payment, update loan, and record both income and expense transactions', async () => {
    const loan = {
      id: 'loan_abc',
      total_owed: 1000,
      repaid_amount: 0,
      status: 'outstanding',
      debtor_id: 'debtor456', // Crucial for conditional logic
      debtor_name: 'John Doe'
    };

    // Mock three successful fetches: 1. Upload (skipped here), 2. Loan PATCH, 3. Creditor POST, 4. Debtor POST
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    renderWidget(loan);

    const input = screen.getByLabelText(/Amount Received/i);
    fireEvent.change(input, { target: { value: '200' } });

    const button = screen.getByRole('button', { name: /Record Repayment/i });
    fireEvent.click(button);

    await waitFor(() => {
      // 1. Check Loan Update (PATCH)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/loans/loan_abc'),
        expect.objectContaining({
            method: 'PATCH',
            body: expect.stringContaining('"repaid_amount":200')
        })
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/loans/loan_abc'),
        expect.objectContaining({
            body: expect.stringContaining('"status":"outstanding"')
        })
      );
      
      // 2. Check Transaction POSTs (Should be 2 separate POST calls to /transactions)
      const transactionCalls = mockFetch.mock.calls.filter(call => call[0].includes('/transactions') && call[1].method === 'POST');
      expect(transactionCalls).toHaveLength(2);

      // Check Creditor Income (User is creditor123)
      expect(JSON.parse(transactionCalls[0][1].body)).toEqual(expect.objectContaining({
        user_id: 'creditor123',
        type: 'income',
        amount: 200,
        description: expect.stringContaining('Repayment received from John Doe'),
      }));

      // Check Debtor Expense (User is debtor456)
      expect(JSON.parse(transactionCalls[1][1].body)).toEqual(expect.objectContaining({
        user_id: 'debtor456',
        type: 'expense',
        amount: 200,
        description: expect.stringContaining('Repayment sent to Creditor Test'),
      }));
      
      // Ensure onSuccess was called
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });

  // --- TEST CASE 3: FULL PAYMENT ---
  it('should process a full payment and update status to "repaid"', async () => {
    const loan = {
      id: 'loan_xyz',
      total_owed: 1000,
      repaid_amount: 500, // 500 already paid
      status: 'outstanding',
      debtor_name: 'Jane Doe'
    };

    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    renderWidget(loan);

    const input = screen.getByLabelText(/Amount Received/i);
    fireEvent.change(input, { target: { value: '500' } });

    // FIXED: Updated regex to match "Record Repayment Received"
    const button = screen.getByRole('button', { name: /Record Repayment/i });
    fireEvent.click(button);

    await waitFor(() => {
      // 1. Check Loan Update (PATCH)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/loans/loan_xyz'),
        expect.objectContaining({
            body: expect.stringContaining('"status":"repaid"')
        })
      );
      
      // 2. Check Transaction POSTs (Should be 1 POST if debtor_id is missing, or 2 if present. Since it's missing, should be 1.)
      const transactionCalls = mockFetch.mock.calls.filter(call => call[0].includes('/transactions') && call[1].method === 'POST');
      expect(transactionCalls).toHaveLength(1); // Only Creditor Income is recorded

    });
  });
});