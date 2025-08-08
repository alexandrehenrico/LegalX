import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Process, Lawyer } from '../../types';
import { ArrowLeftIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { localStorageService } from '../../services/localStorage';

const schema = yup.object({
  name: yup.string().required('Nome do processo é obrigatório'),
  processNumber: yup.string().required('Número do processo é obrigatório'),
  client: yup.string().required('Cliente é obrigatório'),
  opposingParty: yup.string(),
  court: yup.string().required('Fórum/Comarca é obrigatório'),
  responsibleLawyer: yup.string().required('Advogado responsável é obrigatório'),
  startDate: yup.string().required('Data de início é obrigatória'),
  status: yup.string().required('Status é obrigatório'),
  description: yup.string().required('Descrição é obrigatória'),
  notes: yup.string()
});

interface ProcessFormProps {
  process?: Process | null;
  onBack: () => void;
  onSave: (process: Process) => void;
}

export default function ProcessForm({ process, onBack, onSave }: ProcessFormProps) {
  const [attachments, setAttachments] = useState<string[]>(process?.attachments || []);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<Partial<Process>>({
    resolver: yupResolver(schema),
    defaultValues: process || {
      status: 'Em andamento'
    }
  });

  useEffect(() => {
    // Carregar advogados
    const loadedLawyers = localStorageService.getLawyers().filter(l => l.status === 'Ativo');
    setLawyers(loadedLawyers);
    
    if (process) {
      Object.keys(process).forEach((key) => {
        setValue(key as keyof Process, process[key as keyof Process]);
      });
      setAttachments(process.attachments || []);
    }
  }, [process, setValue]);

  const onSubmit = (data: Partial<Process>) => {
    try {
      if (process) {
        // Atualizar processo existente
        const updatedProcess = localStorageService.updateProcess(process.id, {
          ...data,
          attachments
        } as Partial<Process>);
        
        if (updatedProcess) {
          console.log('Processo atualizado com sucesso');
          onSave(updatedProcess);
        } else {
          alert('Erro ao atualizar processo');
        }
      } else {
        // Criar novo processo
        const newProcess = localStorageService.saveProcess({
          ...data,
          attachments
        } as Omit<Process, 'id' | 'createdAt'>);
        
        console.log('Novo processo criado com sucesso');
        onSave(newProcess);
      }
    } catch (error) {
      console.error('Erro ao salvar processo:', error);
      alert('Erro ao salvar processo. Tente novamente.');
    }
  };

  const addAttachment = () => {
    const fileName = prompt('Nome do arquivo anexado:');
    if (fileName && fileName.trim()) {
      setAttachments([...attachments, fileName.trim()]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Voltar
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {process ? 'Editar Processo' : 'Novo Processo'}
          </h1>
          <p className="text-gray-600">
            {process ? 'Atualize as informações do processo' : 'Cadastre um novo processo jurídico'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Processo *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Execução Fiscal – José Santos"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número do Processo *
                </label>
                <input
                  {...register('processNumber')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0001234-56.2023.8.02.0001"
                />
                {errors.processNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.processNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <input
                  {...register('client')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do cliente"
                />
                {errors.client && (
                  <p className="text-red-500 text-sm mt-1">{errors.client.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parte Contrária
                </label>
                <input
                  {...register('opposingParty')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome da parte contrária"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fórum/Comarca e Vara *
                </label>
                <input
                  {...register('court')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Comarca de São Paulo - 1ª Vara Cível"
                />
                {errors.court && (
                  <p className="text-red-500 text-sm mt-1">{errors.court.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advogado Responsável *
                </label>
                <select
                  {...register('responsibleLawyer')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um advogado</option>
                  {lawyers.map((lawyer) => (
                    <option key={lawyer.id} value={lawyer.fullName}>
                      {lawyer.fullName} - OAB: {lawyer.oab}
                    </option>
                  ))}
                </select>
                {errors.responsibleLawyer && (
                  <p className="text-red-500 text-sm mt-1">{errors.responsibleLawyer.message}</p>
                )}
                {lawyers.length === 0 && (
                  <p className="text-amber-600 text-sm mt-1">
                    Nenhum advogado ativo encontrado. Cadastre advogados na aba "Advogados".
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Início *
                </label>
                <input
                  {...register('startDate')}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.startDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Em andamento">Em andamento</option>
                  <option value="Concluído">Concluído</option>
                </select>
                {errors.status && (
                  <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhes do Caso</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição Principal *
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descreva os detalhes principais do caso..."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anotações Complementares
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Observações adicionais..."
                />
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Documentos Anexos</h3>
              <button
                type="button"
                onClick={addAttachment}
                className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Adicionar Anexo
              </button>
            </div>
            
            {attachments.length > 0 ? (
              <div className="space-y-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{attachment}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Nenhum documento anexado</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {process ? 'Atualizar' : 'Salvar'} Processo
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}