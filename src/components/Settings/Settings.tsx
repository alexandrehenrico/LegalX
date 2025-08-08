/**
 * Componente de Configurações do Sistema
 * 
 * Fornece interface para gerenciamento de dados, backup/restauração
 * e configurações gerais do sistema LegalX.
 */

import React, { useState, useEffect } from 'react';
import { 
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { DataManager } from '../../utils/dataManager';

export default function Settings() {
  const [stats, setStats] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    try {
      const systemStats = DataManager.getSystemStats();
      setStats(systemStats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleValidateData = () => {
    setLoading(true);
    try {
      const result = DataManager.validateDataIntegrity();
      setValidationResult(result);
    } catch (error) {
      console.error('Erro ao validar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      DataManager.importBackup(file);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
        <p className="text-gray-600">Gerencie dados, backup e configurações gerais</p>
      </div>

      {/* System Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2" />
            Estatísticas do Sistema
          </h3>
          
          {stats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-blue-600">Processos</p>
                  <p className="text-xl font-bold text-blue-700">{stats.totalProcesses}</p>
                  <p className="text-xs text-blue-500">
                    {stats.activeProcesses} ativos, {stats.completedProcesses} concluídos
                  </p>
                </div>
                
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-sm text-green-600">Eventos</p>
                  <p className="text-xl font-bold text-green-700">{stats.totalEvents}</p>
                  <p className="text-xs text-green-500">
                    {stats.pendingEvents} pendentes, {stats.completedEvents} concluídos
                  </p>
                </div>
                
                <div className="bg-purple-50 p-3 rounded">
                  <p className="text-sm text-purple-600">Receitas</p>
                  <p className="text-lg font-bold text-purple-700">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                
                <div className="bg-red-50 p-3 rounded">
                  <p className="text-sm text-red-600">Despesas</p>
                  <p className="text-lg font-bold text-red-700">{formatCurrency(stats.totalExpenses)}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Uso do Armazenamento</p>
                <div className="flex items-center mt-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(stats.storageUsed?.percentage || 0, 100)}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-xs text-gray-500">
                    {formatBytes(stats.storageUsed?.used || 0)} / {formatBytes(stats.storageUsed?.total || 0)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Carregando estatísticas...</p>
          )}
        </div>

        {/* Data Validation */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            Validação de Dados
          </h3>
          
          <div className="space-y-4">
            <button
              onClick={handleValidateData}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Validando...' : 'Validar Integridade dos Dados'}
            </button>
            
            {validationResult && (
              <div className={`p-4 rounded-lg ${
                validationResult.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center mb-2">
                  {validationResult.isValid ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                  ) : (
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
                  )}
                  <span className={`font-medium ${
                    validationResult.isValid ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {validationResult.isValid ? 'Dados íntegros' : 'Problemas encontrados'}
                  </span>
                </div>
                
                {validationResult.errors.length > 0 && (
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationResult.errors.map((error: string, index: number) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Backup & Restore */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup e Restauração</h3>
          
          <div className="space-y-4">
            <button
              onClick={DataManager.exportBackup}
              className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Fazer Backup dos Dados
            </button>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurar Backup
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Selecione um arquivo de backup (.json) para restaurar
              </p>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gerenciamento de Dados</h3>
          
          <div className="space-y-4">
            <button
              onClick={DataManager.createSampleData}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <DocumentDuplicateIcon className="w-5 h-5 mr-2" />
              Criar Dados de Exemplo
            </button>
            
            <div className="border-t pt-4">
              <button
                onClick={DataManager.clearAllData}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <TrashIcon className="w-5 h-5 mr-2" />
                Limpar Todos os Dados
              </button>
              <p className="text-xs text-red-500 mt-1">
                ⚠️ Esta ação não pode ser desfeita
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Instruções de Uso</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Backup:</strong> Recomendamos fazer backup regularmente dos seus dados.</p>
          <p><strong>Validação:</strong> Execute a validação periodicamente para garantir a integridade dos dados.</p>
          <p><strong>Armazenamento:</strong> Os dados são salvos localmente no seu navegador.</p>
          <p><strong>Dados de Exemplo:</strong> Use para testar o sistema com dados fictícios.</p>
        </div>
      </div>
    </div>
  );
}