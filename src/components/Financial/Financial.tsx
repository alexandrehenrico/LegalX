import React, { useState, useEffect } from 'react';
import { Revenue, Expense } from '../../types';
import { localStorageService } from '../../services/localStorage';
import FinancialForm from './FinancialForm';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinancialProps {
  quickActionType?: string | null;
  onClearQuickAction: () => void;
}

export default function Financial({ quickActionType, onClearQuickAction }: FinancialProps) {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeTab, setActiveTab] = useState<'revenues' | 'expenses'>('revenues');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'revenue' | 'expense'>('revenue');
  const [selectedItem, setSelectedItem] = useState<Revenue | Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, []);

  useEffect(() => {
    if (quickActionType === 'revenue') {
      setActiveTab('revenues');
      setFormType('revenue');
      setShowForm(true);
      setSelectedItem(null);
      onClearQuickAction();
    } else if (quickActionType === 'expense') {
      setActiveTab('expenses');
      setFormType('expense');
      setShowForm(true);
      setSelectedItem(null);
      onClearQuickAction();
    }
  }, [quickActionType, onClearQuickAction]);

  const loadFinancialData = () => {
    try {
      const loadedRevenues = localStorageService.getRevenues();
      const loadedExpenses = localStorageService.getExpenses();
      setRevenues(loadedRevenues);
      setExpenses(loadedExpenses);
      console.log(`${loadedRevenues.length} receitas e ${loadedExpenses.length} despesas carregadas`);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const handleNewItem = (type: 'revenue' | 'expense') => {
    setFormType(type);
    setSelectedItem(null);
    setShowForm(true);
  };

  const handleEditItem = (item: Revenue | Expense, type: 'revenue' | 'expense') => {
    setFormType(type);
    setSelectedItem(item);
    setShowForm(true);
  };

  const handleSaveItem = (data: Revenue | Expense, type: 'revenue' | 'expense') => {
    try {
      if (type === 'revenue') {
        const revenueData = data as Revenue;
        if (selectedItem) {
          // Atualizar receita existente
          const updatedRevenue = localStorageService.updateRevenue(selectedItem.id, revenueData);
          if (updatedRevenue) {
            console.log('Receita atualizada com sucesso');
          }
        } else {
          // Criar nova receita
          const newRevenue = localStorageService.saveRevenue(revenueData);
          console.log('Nova receita criada com sucesso');
        }
      } else {
        const expenseData = data as Expense;
        if (selectedItem) {
          // Atualizar despesa existente
          const updatedExpense = localStorageService.updateExpense(selectedItem.id, expenseData);
          if (updatedExpense) {
            console.log('Despesa atualizada com sucesso');
          }
        } else {
          // Criar nova despesa
          const newExpense = localStorageService.saveExpense(expenseData);
          console.log('Nova despesa criada com sucesso');
        }
      }
      
      loadFinancialData(); // Recarregar dados
      setShowForm(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Erro ao salvar item financeiro:', error);
      alert('Erro ao salvar. Tente novamente.');
    }
  };

  const handleDeleteItem = (id: string, type: 'revenue' | 'expense') => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      try {
        let success = false;
        if (type === 'revenue') {
          success = localStorageService.deleteRevenue(id);
        } else {
          success = localStorageService.deleteExpense(id);
        }
        
        if (success) {
          loadFinancialData(); // Recarregar dados
        }
      } catch (error) {
        console.error('Erro ao excluir item:', error);
        alert('Erro ao excluir item. Tente novamente.');
      }
    }
  };

  const filteredRevenues = revenues.filter(revenue =>
    revenue.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (revenue.client && revenue.client.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (revenue.description && revenue.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredExpenses = expenses.filter(expense =>
    expense.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (expense.description && expense.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalRevenues = revenues.reduce((sum, revenue) => sum + revenue.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const balance = totalRevenues - totalExpenses;

  if (showForm) {
    return (
      <FinancialForm
        type={formType}
        item={selectedItem}
        onBack={() => {
          setShowForm(false);
          setSelectedItem(null);
        }}
        onSave={handleSaveItem}
      />
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão Financeira</h1>
          <p className="text-gray-600">Controle de receitas e despesas do escritório</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleNewItem('revenue')}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <ArrowUpIcon className="w-4 h-4 mr-2" />
            Nova Receita
          </button>
          <button
            onClick={() => handleNewItem('expense')}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowDownIcon className="w-4 h-4 mr-2" />
            Nova Despesa
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <ArrowUpIcon className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-600">Total de Receitas</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totalRevenues)}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <ArrowDownIcon className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-red-600">Total de Despesas</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>

        <div className={`border-2 rounded-lg p-6 ${
          balance >= 0 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
              balance >= 0 ? 'bg-blue-600' : 'bg-red-600'
            }`}>
              <span className="text-white font-bold text-sm">R$</span>
            </div>
            <div>
              <p className={`text-sm font-medium ${
                balance >= 0 ? 'text-blue-600' : 'text-red-600'
              }`}>
                Saldo Atual
              </p>
              <p className={`text-2xl font-bold ${
                balance >= 0 ? 'text-blue-700' : 'text-red-700'
              }`}>
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('revenues')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'revenues'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Receitas ({revenues.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'expenses'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Despesas ({expenses.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      {activeTab === 'revenues' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fonte/Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Advogado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRevenues.map((revenue) => (
                  <tr key={revenue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(revenue.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{revenue.source}</div>
                        {revenue.client && (
                          <div className="text-sm text-gray-500">{revenue.client}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {revenue.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {revenue.responsibleLawyer || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(revenue.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {revenue.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditItem(revenue, 'revenue')}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(revenue.id, 'revenue')}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Excluir"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Carregando receitas...</p>
            </div>
          ) : filteredRevenues.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {revenues.length === 0 
                  ? 'Nenhuma receita cadastrada. Clique em "Nova Receita" para começar.' 
                  : 'Nenhuma receita encontrada com os filtros aplicados.'
                }
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Advogado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.responsibleLawyer || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditItem(expense, 'expense')}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(expense.id, 'expense')}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Excluir"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Carregando despesas...</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {expenses.length === 0 
                  ? 'Nenhuma despesa cadastrada. Clique em "Nova Despesa" para começar.' 
                  : 'Nenhuma despesa encontrada com os filtros aplicados.'
                }
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}