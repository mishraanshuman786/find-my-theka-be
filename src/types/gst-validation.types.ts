export interface GstinCheckData{
    gstin:string;
    sts:string;
    lgnm?:string;
    tradeNam?:string;
    rgdt?:string;
    cxdt?:string;
    errorMsg?: string | null;
    [key:string]:unknown;
}

export interface GstinCheckResponse {
  flag: boolean;
  message: string;
  data?: GstinCheckData | null;
}

export interface GstBalanceResponse {
  flag: boolean;
  message: string;
  data?: number;
}

export interface GstValidationResult {
  gstin: string;
  valid: boolean;
  registrationStatus: string | null;
  legalName: string | null;
  tradeName: string | null;
  registrationDate: string | null;
  cancellationDate: string | null;
  message: string;
  creditsRemaining: number;
  checkedAt: string;
}