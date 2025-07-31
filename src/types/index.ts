export interface Process {
  id: string;
  name: string;
  processNumber: string;
  client: string;
  opposingParty?: string;
  court: string;
  responsibleLawyer: string;
  startDate: string;
  status: 'Em andamento' | 'Concluído';
  description: string;
  notes?: string;
  attachments?: string[];
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  client?: string;
  type: 'Audiência' | 'Reunião' | 'Prazo' | 'Outro';
  location?: string;
  notes?: string;
  status: 'Pendente' | 'Concluído';
  lawyer: string;
}

export interface Revenue {
  id: string;
  date: string;
  amount: number;
  source: string;
  category: 'Honorário' | 'Consultoria' | 'Outro';
  client?: string;
  description?: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  type: string;
  category: 'Aluguel' | 'Internet' | 'Material' | 'Outro';
  description?: string;
  receipt?: string;
}

export interface Document {
  id: string;
  type: 'Procuração' | 'Recibo';
  client: string;
  createdAt: string;
  data: any;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  balance: number;
  monthlyData: Array<{
    month: string;
    revenue: number;
    expenses: number;
  }>;
}