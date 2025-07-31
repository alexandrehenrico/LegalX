import React from 'react';
import { 
  FolderIcon, 
  DocumentTextIcon, 
  CalendarIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import FinancialCard from './FinancialCard';
import StatsCard from './StatsCard';
import CashFlowChart from './CashFlowChart';
import RecentItems from './RecentItems';
import { mockFinancialSummary, mockProcesses, mockEvents, mockDocuments } from '../../data/mockData';

export default function Dashboard() {
  const activeProcesses = mockProcesses.filter(p => p.status === 'Em andamento').length;
  const completedProcesses = mockProcesses.filter(p => p.status === 'Concluído').length;
  const upcomingEvents = mockEvents.filter(e => e.status === 'Pendente').length;
  const recentDocuments = mockDocuments.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do escritório de advocacia</p>
      </div>

      {/* Financial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FinancialCard
          title="Receitas do Mês"
          amount={mockFinancialSummary.totalRevenue}
          type="revenue"
          change={12.5}
        />
        <FinancialCard
          title="Despesas do Mês"
          amount={mockFinancialSummary.totalExpenses}
          type="expense"
          change={-3.2}
        />
        <FinancialCard
          title="Saldo Atual"
          amount={mockFinancialSummary.balance}
          type="balance"
          change={18.7}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Processos Ativos"
          value={activeProcesses}
          icon={FolderIcon}
          color="bg-blue-500"
          description="Em andamento"
        />
        <StatsCard
          title="Processos Concluídos"
          value={completedProcesses}
          icon={CheckCircleIcon}
          color="bg-green-500"
          description="Este mês"
        />
        <StatsCard
          title="Próximos Compromissos"
          value={upcomingEvents}
          icon={CalendarIcon}
          color="bg-amber-500"
          description="Próximos 7 dias"
        />
        <StatsCard
          title="Documentos Emitidos"
          value={recentDocuments}
          icon={DocumentTextIcon}
          color="bg-purple-500"
          description="Este mês"
        />
      </div>

      {/* Charts and Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashFlowChart data={mockFinancialSummary.monthlyData} />
        <div className="space-y-6">
          <RecentItems
            title="Próximos Compromissos"
            items={mockEvents.filter(e => e.status === 'Pendente')}
            type="events"
          />
          <RecentItems
            title="Documentos Recentes"
            items={mockDocuments}
            type="documents"
          />
        </div>
      </div>
    </div>
  );
}