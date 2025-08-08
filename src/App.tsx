import React, { useState } from 'react';
import AuthWrapper from './components/Auth/AuthWrapper';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import ProcessList from './components/Processes/ProcessList';
import ProcessForm from './components/Processes/ProcessForm';
import ProcessView from './components/Processes/ProcessView';
import Calendar from './components/Calendar/Calendar';
import CalendarForm from './components/Calendar/CalendarForm';
import Financial from './components/Financial/Financial';
import FinancialForm from './components/Financial/FinancialForm';
import DocumentGenerator from './components/Documents/DocumentGenerator';
import Reports from './components/Reports/Reports';
import Settings from './components/Settings/Settings';
import LawyerList from './components/Lawyers/LawyerList';
import LawyerForm from './components/Lawyers/LawyerForm';
import LawyerView from './components/Lawyers/LawyerView';
import { Process, CalendarEvent } from './types';
import { Lawyer } from './types';
import { User } from './types/auth';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'form' | 'view'>('list');
  const [quickActionType, setQuickActionType] = useState<string | null>(null);

  const handleLogout = () => {
    // Recarregar a página para limpar o estado e mostrar tela de login
    window.location.reload();
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setViewMode('list');
    setSelectedProcess(null);
    setSelectedEvent(null);
    setSelectedLawyer(null);
    setQuickActionType(null);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'new-power-of-attorney':
        setActiveSection('documents');
        setQuickActionType('power-of-attorney');
        break;
      case 'new-receipt':
        setActiveSection('documents');
        setQuickActionType('receipt');
        break;
      case 'new-revenue':
        setActiveSection('financial');
        setQuickActionType('revenue');
        break;
      case 'new-expense':
        setActiveSection('financial');
        setQuickActionType('expense');
        break;
      case 'new-process':
        setActiveSection('processes');
        setViewMode('form');
        setSelectedProcess(null);
        break;
      case 'new-event':
        setActiveSection('calendar');
        setQuickActionType('event');
        break;
      case 'new-lawyer':
        setActiveSection('lawyers');
        setViewMode('form');
        setSelectedLawyer(null);
        break;
    }
  };

  const handleNewProcess = () => {
    setViewMode('form');
    setSelectedProcess(null);
  };

  const handleViewProcess = (process: Process) => {
    setSelectedProcess(process);
    setViewMode('view');
  };

  const handleEditProcess = (process: Process) => {
    setSelectedProcess(process);
    setViewMode('form');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedProcess(null);
    setSelectedEvent(null);
    setSelectedLawyer(null);
    setQuickActionType(null);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      
      case 'processes':
        switch (viewMode) {
          case 'form':
            return (
              <ProcessForm
                process={selectedProcess}
                onBack={handleBackToList}
                onSave={handleBackToList}
              />
            );
          case 'view':
            return (
              <ProcessView
                process={selectedProcess!}
                onBack={handleBackToList}
                onEdit={() => setViewMode('form')}
                onUpdate={(updatedProcess) => {
                  setSelectedProcess(updatedProcess);
                }}
              />
            );
          default:
            return (
              <ProcessList
                onNewProcess={handleNewProcess}
                onViewProcess={handleViewProcess}
                onEditProcess={handleEditProcess}
              />
            );
        }
      
      case 'calendar':
        return (
          <Calendar
            quickActionType={quickActionType}
            onClearQuickAction={() => setQuickActionType(null)}
          />
        );
      
      case 'financial':
        return (
          <Financial
            quickActionType={quickActionType}
            onClearQuickAction={() => setQuickActionType(null)}
          />
        );
      
      case 'documents':
        return (
          <DocumentGenerator
            quickActionType={quickActionType}
            onClearQuickAction={() => setQuickActionType(null)}
          />
        );
      
      case 'reports':
        return <Reports />;
      
      case 'settings':
        return <Settings />;
      
      case 'lawyers':
        switch (viewMode) {
          case 'form':
            return (
              <LawyerForm
                lawyer={selectedLawyer}
                onBack={handleBackToList}
                onSave={handleBackToList}
              />
            );
          case 'view':
            return (
              <LawyerView
                lawyer={selectedLawyer!}
                onBack={handleBackToList}
                onEdit={() => setViewMode('form')}
                onUpdate={(updatedLawyer) => {
                  setSelectedLawyer(updatedLawyer);
                }}
              />
            );
          default:
            return (
              <LawyerList
                onNewLawyer={() => {
                  setViewMode('form');
                  setSelectedLawyer(null);
                }}
                onViewLawyer={(lawyer) => {
                  setSelectedLawyer(lawyer);
                  setViewMode('view');
                }}
                onEditLawyer={(lawyer) => {
                  setSelectedLawyer(lawyer);
                  setViewMode('form');
                }}
              />
            );
        }
      
      default:
        return <Dashboard />;
    }
  };

  const renderApp = (user: User) => (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          onQuickAction={handleQuickAction}
        />
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );

  return (
    <AuthWrapper>
      {renderApp}
    </AuthWrapper>
  );
}

export default App;