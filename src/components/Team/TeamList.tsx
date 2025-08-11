import React, { useState, useEffect } from 'react';
import { Lawyer, Employee } from '../../types';
import { localStorageService } from '../../services/localStorage';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  UserIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TeamListProps {
  onNewLawyer: () => void;
  onNewEmployee: () => void;
  onViewLawyer: (lawyer: Lawyer) => void;
  onViewEmployee: (employee: Employee) => void;
  onEditLawyer: (lawyer: Lawyer) => void;
  onEditEmployee: (employee: Employee) => void;
}

export default function TeamList({ 
  onNewLawyer, 
  onNewEmployee, 
  onViewLawyer, 
  onViewEmployee, 
  onEditLawyer, 
  onEditEmployee 
}: TeamListProps) {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeTab, setActiveTab] = useState<'lawyers' | 'employees'>('lawyers');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = () => {
    try {
      const loadedLawyers = localStorageService.getLawyers();
      const loadedEmployees = localStorageService.getEmployees();
      setLawyers(loadedLawyers);
      setEmployees(loadedEmployees);
      console.log(`${loadedLawyers.length} advogados e ${loadedEmployees.length} colaboradores carregados`);
    } catch (error) {
      console.error('Erro ao carregar dados da equipe:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLawyer = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este advogado?')) {
      try {
        const success = localStorageService.deleteLawyer(id);
        if (success) {
          loadTeamData();
        }
      } catch (error) {
        console.error('Erro ao excluir advogado:', error);
        alert('Erro ao excluir advogado. Tente novamente.');
      }
    }
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este colaborador?')) {
      try {
        const success = localStorageService.deleteEmployee(id);
        if (success) {
          loadTeamData();
        }
      } catch (error) {
        console.error('Erro ao excluir colaborador:', error);
        alert('Erro ao excluir colaborador. Tente novamente.');
      }
    }
  };

  const filteredLawyers = lawyers.filter(lawyer => {
    const matchesSearch = lawyer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lawyer.oab.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lawyer.cpf.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lawyer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.cpf.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatCpf = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipe</h1>
          <p className="text-gray-600">Gerencie advogados e colaboradores do escritório</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onNewLawyer}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserIcon className="w-5 h-5 mr-2" />
            Novo Advogado
          </button>
          <button
            onClick={onNewEmployee}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <BriefcaseIcon className="w-5 h-5 mr-2" />
            Novo Colaborador
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('lawyers')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'lawyers'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Advogados ({lawyers.length})
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'employees'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Colaboradores ({employees.length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
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
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'lawyers' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLawyers.map((lawyer) => (
            <div key={lawyer.id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Photo and Status */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {lawyer.photo ? (
                      <img
                        src={lawyer.photo}
                        alt={lawyer.fullName}
                        className="w-12 h-12 rounded-full object-cover mr-3"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <UserIcon className="w-6 h-6 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{lawyer.fullName}</h3>
                      <p className="text-sm text-gray-500">OAB: {lawyer.oab}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      lawyer.status === 'Ativo'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {lawyer.status}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">CPF:</span>
                    <span className="text-gray-900">{formatCpf(lawyer.cpf)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Comissão:</span>
                    <span className="text-gray-900">{lawyer.commission}%</span>
                  </div>
                  {lawyer.email && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Email:</span>
                      <span className="text-gray-900 truncate">{lawyer.email}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Cadastrado:</span>
                    <span className="text-gray-900">{formatDate(lawyer.createdAt)}</span>
                  </div>
                </div>

                {/* Specialties */}
                {lawyer.specialties && lawyer.specialties.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Especialidades:</p>
                    <div className="flex flex-wrap gap-1">
                      {lawyer.specialties.slice(0, 3).map((specialty, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                      {lawyer.specialties.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          +{lawyer.specialties.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                  <button
                    onClick={() => onViewLawyer(lawyer)}
                    className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50"
                    title="Visualizar"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEditLawyer(lawyer)}
                    className="text-amber-600 hover:text-amber-900 p-2 rounded hover:bg-amber-50"
                    title="Editar"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteLawyer(lawyer.id)}
                    className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50"
                    title="Excluir"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <div key={employee.id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Photo and Status */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {employee.photo ? (
                      <img
                        src={employee.photo}
                        alt={employee.fullName}
                        className="w-12 h-12 rounded-full object-cover mr-3"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <BriefcaseIcon className="w-6 h-6 text-green-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{employee.fullName}</h3>
                      <p className="text-sm text-gray-500">{employee.position}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      employee.status === 'Ativo'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {employee.status}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">CPF:</span>
                    <span className="text-gray-900">{formatCpf(employee.cpf)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Salário:</span>
                    <span className="text-gray-900">{formatCurrency(employee.salary)}</span>
                  </div>
                  {employee.email && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Email:</span>
                      <span className="text-gray-900 truncate">{employee.email}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Cadastrado:</span>
                    <span className="text-gray-900">{formatDate(employee.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                  <button
                    onClick={() => onViewEmployee(employee)}
                    className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50"
                    title="Visualizar"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEditEmployee(employee)}
                    className="text-amber-600 hover:text-amber-900 p-2 rounded hover:bg-amber-50"
                    title="Editar"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEmployee(employee.id)}
                    className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50"
                    title="Excluir"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando equipe...</p>
        </div>
      ) : (
        <>
          {activeTab === 'lawyers' && filteredLawyers.length === 0 && (
            <div className="text-center py-12">
              <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {lawyers.length === 0 
                  ? 'Nenhum advogado cadastrado. Clique em "Novo Advogado" para começar.' 
                  : 'Nenhum advogado encontrado com os filtros aplicados.'
                }
              </p>
            </div>
          )}
          {activeTab === 'employees' && filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <BriefcaseIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {employees.length === 0 
                  ? 'Nenhum colaborador cadastrado. Clique em "Novo Colaborador" para começar.' 
                  : 'Nenhum colaborador encontrado com os filtros aplicados.'
                }
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}