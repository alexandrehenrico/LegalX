import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ArrowLeftIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import { localStorageService } from '../../services/localStorage';

const schema = yup.object({
  clientName: yup.string().required('Nome do cliente é obrigatório'),
  clientCpf: yup.string().required('CPF do cliente é obrigatório'),
  clientRg: yup.string().required('RG do cliente é obrigatório'),
  clientAddress: yup.string().required('Endereço do cliente é obrigatório'),
  lawyerName: yup.string().required('Nome do advogado é obrigatório'),
  lawyerOab: yup.string().required('OAB do advogado é obrigatória'),
  type: yup.string().required('Tipo de procuração é obrigatório'),
  object: yup.string().required('Objeto da procuração é obrigatório'),
  location: yup.string().required('Local é obrigatório'),
  date: yup.string().required('Data é obrigatória')
});

interface PowerOfAttorneyFormProps {
  onBack: () => void;
  onSave?: () => void;
}

interface PowerOfAttorneyData {
  clientName: string;
  clientCpf: string;
  clientRg: string;
  clientAddress: string;
  lawyerName: string;
  lawyerOab: string;
  type: string;
  object: string;
  location: string;
  date: string;
}

export default function PowerOfAttorneyForm({ onBack, onSave }: PowerOfAttorneyFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PowerOfAttorneyData>({
    resolver: yupResolver(schema),
    defaultValues: {
      type: 'Ad Judicia',
      date: new Date().toISOString().split('T')[0]
    }
  });

  const generatePDF = (data: PowerOfAttorneyData) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('PROCURAÇÃO', 105, 30, { align: 'center' });
    
    // Content
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    
    let yPosition = 60;
    const lineHeight = 8;
    
    const content = `
Pelo presente instrumento particular de procuração, eu, ${data.clientName}, 
${data.clientCpf.includes('.') ? 'CPF' : 'CPF'} nº ${data.clientCpf}, RG nº ${data.clientRg}, 
residente e domiciliado em ${data.clientAddress}, 

NOMEIO e CONSTITUO como meu bastante procurador o(a) Sr(a). ${data.lawyerName}, 
inscrito(a) na OAB sob nº ${data.lawyerOab}, para o fim específico de:

${data.object}

Outorgo-lhe poderes para representar-me ${data.type === 'Ad Judicia' ? 'em juízo' : 'para os fins específicos acima descritos'}, 
podendo para tanto praticar todos os atos necessários ao bom e fiel cumprimento 
do presente mandato.

Por ser verdade, firmo a presente.

${data.location}, ${new Date(data.date).toLocaleDateString('pt-BR')}.


_________________________________
${data.clientName}
Outorgante
    `.trim();

    const lines = doc.splitTextToSize(content, 170);
    
    lines.forEach((line: string) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 30;
      }
      doc.text(line, 20, yPosition);
      yPosition += lineHeight;
    });

    // Save PDF
    doc.save(`procuracao_${data.clientName.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  const onSubmit = (data: PowerOfAttorneyData) => {
    try {
      // Salvar documento no localStorage
      const savedDocument = localStorageService.saveDocument({
        type: 'Procuração',
        client: data.clientName,
        data: {
          type: data.type,
          object: data.object,
          location: data.location,
          date: data.date,
          lawyerName: data.lawyerName,
          lawyerOab: data.lawyerOab
        }
      });
      
      console.log('Procuração salva no sistema:', savedDocument);
      
      // Chamar callback para atualizar lista
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Erro ao salvar procuração:', error);
      alert('Erro ao salvar procuração no sistema. Tente novamente.');
    }
    
    generatePDF(data);
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
          <h1 className="text-2xl font-bold text-gray-900">Nova Procuração</h1>
          <p className="text-gray-600">Preencha os dados para gerar a procuração</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Client Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados do Cliente (Outorgante)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  {...register('clientName')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome completo do cliente"
                />
                {errors.clientName && (
                  <p className="text-red-500 text-sm mt-1">{errors.clientName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF *
                </label>
                <input
                  {...register('clientCpf')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="000.000.000-00"
                />
                {errors.clientCpf && (
                  <p className="text-red-500 text-sm mt-1">{errors.clientCpf.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RG *
                </label>
                <input
                  {...register('clientRg')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="00.000.000-0"
                />
                {errors.clientRg && (
                  <p className="text-red-500 text-sm mt-1">{errors.clientRg.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço Completo *
                </label>
                <input
                  {...register('clientAddress')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Rua, número, bairro, cidade, estado"
                />
                {errors.clientAddress && (
                  <p className="text-red-500 text-sm mt-1">{errors.clientAddress.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Lawyer Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados do Advogado (Outorgado)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Advogado *
                </label>
                <input
                  {...register('lawyerName')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dr(a). Nome do Advogado"
                />
                {errors.lawyerName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lawyerName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OAB *
                </label>
                <input
                  {...register('lawyerOab')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="00000/UF"
                />
                {errors.lawyerOab && (
                  <p className="text-red-500 text-sm mt-1">{errors.lawyerOab.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Procuration Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhes da Procuração</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo *
                </label>
                <select
                  {...register('type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Ad Judicia">Ad Judicia</option>
                  <option value="Para fins específicos">Para fins específicos</option>
                </select>
                {errors.type && (
                  <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Local *
                </label>
                <input
                  {...register('location')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="São Paulo - SP"
                />
                {errors.location && (
                  <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objeto da Procuração *
                </label>
                <textarea
                  {...register('object')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descreva o objeto/finalidade da procuração..."
                />
                {errors.object && (
                  <p className="text-red-500 text-sm mt-1">{errors.object.message}</p>
                )}
              </div>
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
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              Gerar Procuração PDF
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}