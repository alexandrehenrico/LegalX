import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../../types';
import { mockEvents } from '../../data/mockData';
import CalendarForm from './CalendarForm';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarProps {
  quickActionType?: string | null;
  onClearQuickAction: () => void;
}

export default function Calendar({ quickActionType, onClearQuickAction }: CalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (quickActionType === 'event') {
      setShowForm(true);
      setSelectedEvent(null);
      onClearQuickAction();
    }
  }, [quickActionType, onClearQuickAction]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const formatMonthYear = (date: Date) => {
    return format(date, 'MMMM yyyy', { locale: ptBR });
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.date), date)
    );
  };

  const handleNewEvent = (date?: Date) => {
    setSelectedDate(date || null);
    setSelectedEvent(null);
    setShowForm(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowForm(true);
  };

  const handleSaveEvent = (eventData: CalendarEvent) => {
    if (selectedEvent) {
      setEvents(events.map(e => e.id === selectedEvent.id ? eventData : e));
    } else {
      setEvents([...events, { ...eventData, id: Date.now().toString() }]);
    }
    setShowForm(false);
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      setEvents(events.filter(e => e.id !== eventId));
    }
  };

  if (showForm) {
    return (
      <CalendarForm
        event={selectedEvent}
        selectedDate={selectedDate}
        onBack={() => {
          setShowForm(false);
          setSelectedEvent(null);
          setSelectedDate(null);
        }}
        onSave={handleSaveEvent}
      />
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-600">Gerencie compromissos e eventos</p>
        </div>
        <button
          onClick={() => handleNewEvent()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Novo Evento
        </button>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'month'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Mês
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'week'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'day'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Dia
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 capitalize">
            {formatMonthYear(currentDate)}
          </h2>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 bg-gray-50">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 divide-x divide-y divide-gray-200">
          {calendarDays.map(day => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`min-h-32 p-2 ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } hover:bg-gray-50 transition-colors`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-sm font-medium ${
                      isToday
                        ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                        : isCurrentMonth
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  <button
                    onClick={() => handleNewEvent(day)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-all"
                    title="Adicionar evento"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded truncate cursor-pointer group ${
                        event.type === 'Audiência'
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : event.type === 'Reunião'
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : event.type === 'Prazo'
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={`${event.title} - ${event.time}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{event.title}</span>
                        <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEvent(event);
                            }}
                            className="text-gray-500 hover:text-blue-600"
                          >
                            <PencilIcon className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event.id);
                            }}
                            className="text-gray-500 hover:text-red-600"
                          >
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayEvents.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}