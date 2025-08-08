import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CalendarEvent, Lawyer } from '../../types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { localStorageService } from '../../services/localStorage';
import { format } from 'date-fns';

const schema = yup.object({
  title: yup.string().required('Título é obrigatório'),
  date: yup.string().required('Data é obrigatória'),
  time: yup.string().required('Horário é obrigatório'),
  client: yup.string(),
  type: yup.string().required('Tipo é obrigatório'),
  location: yup.string(),
  notes: yup.string(),
  lawyer: yup.string().required('Advogado é obrigatório')
});

interface CalendarFormProps {
  event?: CalendarEvent | null;
  selectedDate?: Date | null;
  onBack: () => void;
  onSave: (event: CalendarEvent) => void;
}

export default function CalendarForm({ event, selectedDate, onBack, onSave }: CalendarFormProps) {
  const [lawyers, setLawyers] = React.useState<Lawyer[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<Partial<CalendarEvent>>({
    resolver: yupResolver(schema),
    defaultValues: event || {
      type: 'Reunião',
      status: 'Pendente'
    }
  });

  useEffect(() => {
    // Carregar advogados ativos
    const loadedLawyers = localStorageService.getLawyers().filter(l => l.status === 'Ativo');
    setLawyers(loadedLawyers);
    
    if (event) {
      Object.keys(event).forEach((key) => {
        setValue(key as keyof CalendarEvent, event[key as keyof CalendarEvent]);
      });
    } else if (selectedDate) {
      setValue('date', format(selectedDate, 'yyyy-MM-dd'));
    }
  }, [event, selectedDate, setValue]);

  const onSubmit = (data: Partial<CalendarEvent>) => {
    const eventData: CalendarEvent = {
      id: event?.id || Date.now().toString(),
      status: 'Pendente',
      ...data
    } as CalendarEvent;
    
    onSave(eventData);
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
            {event ? 'Editar Evento' : 'Novo Evento'}
          </h1>
          <p className="text-gray-600">
            {event ? 'Atualize as informações do evento' : 'Cadastre um novo evento na agenda'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título do Evento *
              </label>
              <input
                {...register('title')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Audiência - João Silva"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data *
              </label>
              <input
                {...register('date')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horário *
              </label>
              <input
                {...register('time')}
                type="time"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.time && (
                <p className="text-red-500 text-sm mt-1">{errors.time.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente
              </label>
              <input
                {...register('client')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome do cliente (opcional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Compromisso *
              </label>
              <select
                {...register('type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Audiência">Audiência</option>
                <option value="Reunião">Reunião</option>
                <option value="Prazo">Prazo</option>
                <option value="Outro">Outro</option>
              </select>
              {errors.type && (
                <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Local
              </label>
              <input
                {...register('location')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Fórum Central - Sala 205"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Advogado Responsável *
              </label>
              <select
                {...register('lawyer')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um advogado</option>
                {lawyers.map((lawyer) => (
                  <option key={lawyer.id} value={lawyer.fullName}>
                    {lawyer.fullName} - OAB: {lawyer.oab}
                  </option>
                ))}
              </select>
              {errors.lawyer && (
                <p className="text-red-500 text-sm mt-1">{errors.lawyer.message}</p>
              )}
              {lawyers.length === 0 && (
                <p className="text-amber-600 text-sm mt-1">
                  Nenhum advogado ativo encontrado. Cadastre advogados na aba "Advogados".
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Observações adicionais sobre o evento..."
              />
            </div>
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
              {event ? 'Atualizar' : 'Salvar'} Evento
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}