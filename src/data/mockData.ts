import { Process, CalendarEvent, Revenue, Expense, Document, FinancialSummary } from '../types';

export const mockProcesses: Process[] = [
  {
    id: '1',
    name: 'Execução Fiscal – José Santos',
    processNumber: '0001234-56.2023.8.02.0001',
    client: 'José Santos',
    opposingParty: 'Fazenda Pública Estadual',
    court: 'Comarca de São Paulo - 1ª Vara Cível',
    responsibleLawyer: 'Dr. Maria Silva',
    startDate: '2023-03-15',
    status: 'Em andamento',
    description: 'Execução fiscal de débito tributário estadual no valor de R$ 45.000,00',
    notes: 'Aguardando citação da devedora',
    createdAt: '2023-03-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Ação Trabalhista – Ana Costa',
    processNumber: '0007890-12.2023.5.02.0001',
    client: 'Ana Costa',
    opposingParty: 'Empresa XYZ Ltda.',
    court: 'TRT 2ª Região - 15ª Vara do Trabalho',
    responsibleLawyer: 'Dr. João Oliveira',
    startDate: '2023-08-20',
    status: 'Concluído',
    description: 'Ação de cobrança de verbas rescisórias e danos morais',
    notes: 'Processo finalizado com acordo em audiência',
    createdAt: '2023-08-20T14:30:00Z'
  }
];

export const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Audiência - José Santos',
    date: '2024-01-25',
    time: '14:00',
    client: 'José Santos',
    type: 'Audiência',
    location: 'Fórum Central - Sala 205',
    notes: 'Audiência de instrução e julgamento',
    status: 'Pendente',
    lawyer: 'Dr. Maria Silva'
  },
  {
    id: '2',
    title: 'Reunião com cliente',
    date: '2024-01-24',
    time: '10:00',
    client: 'Pedro Almeida',
    type: 'Reunião',
    location: 'Escritório',
    notes: 'Discussão sobre estratégia processual',
    status: 'Concluído',
    lawyer: 'Dr. João Oliveira'
  }
];

export const mockRevenues: Revenue[] = [
  {
    id: '1',
    date: '2024-01-15',
    amount: 5000,
    source: 'José Santos',
    category: 'Honorário',
    client: 'José Santos',
    description: 'Honorários contratuais - Execução Fiscal'
  },
  {
    id: '2',
    date: '2024-01-10',
    amount: 1200,
    source: 'Ana Costa',
    category: 'Consultoria',
    client: 'Ana Costa',
    description: 'Consultoria jurídica trabalhista'
  }
];

export const mockExpenses: Expense[] = [
  {
    id: '1',
    date: '2024-01-05',
    amount: 2500,
    type: 'Aluguel do escritório',
    category: 'Aluguel',
    description: 'Aluguel mensal do escritório'
  },
  {
    id: '2',
    date: '2024-01-08',
    amount: 150,
    type: 'Internet',
    category: 'Internet',
    description: 'Plano de internet empresarial'
  }
];

export const mockDocuments: Document[] = [
  {
    id: '1',
    type: 'Procuração',
    client: 'José Santos',
    createdAt: '2024-01-20T09:00:00Z',
    data: {
      type: 'Ad Judicia',
      object: 'Execução Fiscal',
      location: 'São Paulo'
    }
  },
  {
    id: '2',
    type: 'Recibo',
    client: 'Ana Costa',
    createdAt: '2024-01-18T15:30:00Z',
    data: {
      amount: 1200,
      description: 'Consultoria jurídica',
      paymentMethod: 'PIX'
    }
  }
];

export const mockFinancialSummary: FinancialSummary = {
  totalRevenue: 6200,
  totalExpenses: 2650,
  balance: 3550,
  monthlyData: [
    { month: 'Set', revenue: 4500, expenses: 2800 },
    { month: 'Out', revenue: 5200, expenses: 2600 },
    { month: 'Nov', revenue: 3800, expenses: 2400 },
    { month: 'Dez', revenue: 6800, expenses: 3200 },
    { month: 'Jan', revenue: 6200, expenses: 2650 }
  ]
};