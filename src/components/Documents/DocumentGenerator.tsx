import React, { useState, useEffect } from 'react';
import PowerOfAttorneyForm from './PowerOfAttorneyForm';
import ReceiptForm from './ReceiptForm';
import { DocumentTextIcon, ReceiptPercentIcon } from '@heroicons/react/24/outline';

interface DocumentGeneratorProps {
  quickActionType?: string | null;
  onClearQuickAction: () => void;
}

export default function DocumentGenerator({ quickActionType, onClearQuickAction }: DocumentGeneratorProps) {
  const [activeDocument, setActiveDocument] = useState<'power-of-attorney' | 'receipt' | null>(null);

  useEffect(() => {
    if (quickActionType === 'power-of-attorney') {
      setActiveDocument('power-of-attorney');
      onClearQuickAction();
    } else if (quickActionType === 'receipt') {
      setActiveDocument('receipt');
      onClearQuickAction();
    }
  }, [quickActionType, onClearQuickAction]);

  if (activeDocument === 'power-of-attorney') {
    return (
      <PowerOfAttorneyForm
        onBack={() => setActiveDocument(null)}
      />
    );
  }

  if (activeDocument === 'receipt') {
    return (
      <ReceiptForm
        onBack={() => setActiveDocument(null)}
      />
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gerador de Documentos</h1>
        <p className="text-gray-600">Crie documentos jurídicos profissionais</p>
      </div>

      {/* Document Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <div
          onClick={() => setActiveDocument('power-of-attorney')}
          className="bg-white rounded-lg shadow-md border-2 border-transparent hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
              <DocumentTextIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Procuração</h3>
            <p className="text-gray-600 mb-4">
              Gere procurações jurídicas com todos os dados necessários
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Procuração Ad Judicia</p>
              <p>• Procuração para fins específicos</p>
              <p>• Geração em PDF e DOCX</p>
            </div>
            <button className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Criar Procuração
            </button>
          </div>
        </div>

        <div
          onClick={() => setActiveDocument('receipt')}
          className="bg-white rounded-lg shadow-md border-2 border-transparent hover:border-green-300 transition-all cursor-pointer group"
        >
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
              <ReceiptPercentIcon className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Recibo</h3>
            <p className="text-gray-600 mb-4">
              Emita recibos profissionais para honorários e serviços
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Recibo de honorários advocatícios</p>
              <p>• Recibo de consultoria jurídica</p>
              <p>• Geração em PDF</p>
            </div>
            <button className="mt-6 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Criar Recibo
            </button>
          </div>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Documentos Recentes</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <p className="text-gray-500 text-center">
              Os documentos gerados aparecerão aqui
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}