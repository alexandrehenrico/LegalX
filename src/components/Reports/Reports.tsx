import React, { useState } from 'react';
import { 
  DocumentChartBarIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  FolderIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { mockFinancialSummary, mockProcesses, mockEvents } from '../../data/mockData';
import jsPDF from 'jspdf';

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  
  // Financial data
  const totalRevenue = mockFinancialSummary.totalRevenue;
  const totalExpenses = mockFinancialSummary.totalExpenses;
  const netProfit = totalRevenue - totalExpenses;
  
  // Process data
  const activeProcesses = mockProcesses.filter(p => p.status === 'Em andamento').length;
  const completedProcesses = mockProcesses.filter(p => p.status === 'Concluído').length;
  
  // Events data
  const totalEvents = mockEvents.length;
  const completedEvents = mockEvents.filter(e => e.status === 'Concluído').length;
  
  // Chart data
  const processStatusData = [
    { name: 'Em andamento', value: activeProcesses, color: '#f59e0b' },
    { name: 'Concluídos', value: completedProcesses, color: '#10b981' }
  ];
  
  const monthlyFinancialData = mockFinancialSummary.monthlyData.map(item => ({
    ...item,
    profit: item.revenue - item.expenses
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const generatePDFReport = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('RELATÓRIO FINANCEIRO E OPERACIONAL', 105, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Período: ${selectedPeriod === 'month' ? 'Janeiro 2024' : 'Ano 2024'}`, 105, 45, { align: 'center' });
    
    let yPosition = 70;
    
    // Financial Summary
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('RESUMO FINANCEIRO', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Total de Receitas: ${formatCurrency(totalRevenue)}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Total de Despesas: ${formatCurrency(totalExpenses)}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Lucro Líquido: ${formatCurrency(netProfit)}`, 20, yPosition);
    yPosition += 20;
    
    // Process Summary
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('RESUMO DE PROCESSOS', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Processos em Andamento: ${activeProcesses}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Processos Concluídos: ${completedProcesses}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Total de Processos: ${activeProcesses + completedProcesses}`, 20, yPosition);
    yPosition += 20;
    
    // Events Summary
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('RESUMO DE EVENTOS', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Total de Eventos: ${totalEvents}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Eventos Concluídos: ${completedEvents}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Taxa de Conclusão: ${((completedEvents / totalEvents) * 100).toFixed(1)}%`, 20, yPosition);
    
    // Footer
    doc.setFontSize(10);
    doc.text(`Relatório gerado em ${new Date().toLocaleDateString('pt-BR')}`, 20, 280);
    doc.text('LegalX - Sistema de Gestão Jurídica', 20, 290);
    
    doc.save(`relatorio_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Análise completa dos dados do escritório</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="month">Mês Atual</option>
            <option value="quarter">Trimestre</option>
            <option value="year">Ano</option>
          </select>
          <button
            onClick={generatePDFReport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <CurrencyDollarIcon className="w-8 h-8 mr-3" />
            <div>
              <p className="text-green-100 text-sm">Receitas</p>
              <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <CurrencyDollarIcon className="w-8 h-8 mr-3" />
            <div>
              <p className="text-red-100 text-sm">Despesas</p>
              <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <FolderIcon className="w-8 h-8 mr-3" />
            <div>
              <p className="text-blue-100 text-sm">Processos Ativos</p>
              <p className="text-2xl font-bold">{activeProcesses}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <CalendarIcon className="w-8 h-8 mr-3" />
            <div>
              <p className="text-purple-100 text-sm">Eventos do Mês</p>
              <p className="text-2xl font-bold">{totalEvents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Financial Flow Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fluxo Financeiro Mensal</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyFinancialData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Receitas" />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Despesas" />
                <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} name="Lucro" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Process Status Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status dos Processos</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {processStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Financeira</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Receita Bruta</span>
              <span className="font-semibold text-green-600">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Despesas Totais</span>
              <span className="font-semibold text-red-600">{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded border-2 border-blue-200">
              <span className="text-gray-900 font-medium">Lucro Líquido</span>
              <span className="font-bold text-blue-600">{formatCurrency(netProfit)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Margem de Lucro</span>
              <span className="font-semibold">{((netProfit / totalRevenue) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Operational Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Operacional</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Total de Processos</span>
              <span className="font-semibold">{activeProcesses + completedProcesses}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Processos Concluídos</span>
              <span className="font-semibold text-green-600">{completedProcesses}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Taxa de Conclusão</span>
              <span className="font-semibold">{((completedProcesses / (activeProcesses + completedProcesses)) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Eventos Realizados</span>
              <span className="font-semibold">{completedEvents}/{totalEvents}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}