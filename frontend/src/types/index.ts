export interface Customer {
  id: number;
  name: string;
  lastName?: string;
  email: string;
  phone: string;
  username?: string;
  createdAt?: string;
}

export interface CreateCustomerRequest {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  password: string;
}

export interface UpdateCustomerRequest {
  name: string;
  email: string;
  phone: string;
}

export interface Account {
  id: number;
  accountNumber: string;
  accountType: string;
  balance: number;
  status: 'ACTIVE' | 'CLOSED' | string;
  createdAt: string;
  customer?: Customer;
}

export interface CreateAccountRequest {
  customerId: number;
  accountNumber: string;
  accountType: string;
}

export interface UpdateAccountRequest {
  accountType: string;
  status: string;
}

export interface Transaction {
  id: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | string;
  amount: number;
  balanceAfter: number;
  description: string;
  transactionDate: string;
  account?: Account;
}

export interface CreateTransactionRequest {
  accountId: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | string;
  amount: number;
  description?: string;
}

export interface Beneficiary {
  id: number;
  name: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  createdAt?: string;
  customer?: Customer;
}

export interface CreateBeneficiaryRequest {
  customerId: number;
  name: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
}

export interface UpdateBeneficiaryRequest {
  name: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
}

export interface Consent {
  id: number;
  purpose: string;
  dataAccess: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  expiresAt?: string;
  customer?: Customer;
}

export interface CreateConsentRequest {
  customerId: number;
  purpose: string;
  dataAccess: string;
  expiresAt?: string;
}

export interface UpdateConsentRequest {
  status: 'APPROVED' | 'REJECTED' | string;
}
