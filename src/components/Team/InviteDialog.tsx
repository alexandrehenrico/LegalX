/**
 * Dialog para criar e gerenciar convites seguros
 * Inclui geração de link, cópia e re-envio
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { inviteService } from '../../services/inviteService';
import type { InviteLink } from '../../types/team';
import { 
  XMarkIcon, 
  UserPlusIcon, 
  LinkIcon, 
  ClipboardDocumentIcon,
  CheckIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const schema = yup.object({
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  role: yup.string().oneOf(['admin', 'member']).required('Função é obrigatória')
});

interface InviteDialogProps {
  teamId: string;
  teamName: string;
  isOpen: boolean;
  onClose: () => void;
  onInviteCreated: () => void;
}

interface InviteFormData {
  email: string;
  role: 'admin' | 'member';
}

export default function InviteDialog({ teamId, teamName, isOpen, onClose, onInviteCreated }: InviteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<InviteLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<InviteFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      role: 'member'
    }
  });

  const handleClose = () => {
    reset();
    setInviteLink(null);
    setError(null);
    setCopied(false);
    onClose();
  };

  const onSubmit = async (data: InviteFormData) => {
    try {
      setLoading(true);
      setError(null);

      const link = await inviteService.createInvitation(teamId, data.email, data.role);
      
      if (link) {
        setInviteLink(link);
        onInviteCreated();
      }

    } catch (error) {
      console.error('Erro ao criar convite:', error);
      setError(error instanceof Error ? error.message : 'Erro ao criar convite');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      // Fallback para navegadores que não suportam clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink.url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sendByEmail = () => {
    if (!inviteLink) return;

    const subject = `Convite para ${teamName} - LegalX`;
    const body = `
Olá!

Você foi convidado para participar da equipe "${teamName}" no LegalX - Sistema de Gestão Jurídica.

Para aceitar o convite, clique no link abaixo:
${inviteLink.url}

Este convite expira em: ${new Date(inviteLink.expiresAt).toLocaleString('pt-BR')}

Se você não solicitou este convite, pode ignorar este email.

Atenciosamente,
Equipe ${teamName}
    `.trim();

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <UserPlusIcon className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">
              {inviteLink ? 'Link de Convite Gerado' : 'Convidar Membro'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {!inviteLink ? (
            /* Formulário de Convite */
            <>
              <div className="mb-6">
                <p className="text-gray-600">
                  Convide um novo membro para a equipe <strong>{teamName}</strong>
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email do Convidado *
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="email@exemplo.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Função na Equipe *
                  </label>
                  <select
                    {...register('role')}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="member">Membro</option>
                    <option value="admin">Administrador</option>
                  </select>
                  {errors.role && (
                    <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
                  )}
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Permissões por Função</h4>
                  <div className="text-xs text-blue-800 space-y-1">
                    <p><strong>Membro:</strong> Acesso aos dados, criar/editar registros</p>
                    <p><strong>Administrador:</strong> Todas as permissões + gerenciar equipe</p>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Criando...
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="w-4 h-4 mr-2" />
                        Criar Convite
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Link Gerado */
            <>
              <div className="mb-6">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                  <CheckIcon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                  Convite Criado com Sucesso!
                </h3>
                <p className="text-gray-600 text-center">
                  O link de convite foi gerado. Compartilhe com o convidado.
                </p>
              </div>

              {/* Link Display */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link de Convite Seguro
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={inviteLink.url}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center ${
                      copied 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                    title="Copiar link"
                  >
                    {copied ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      <ClipboardDocumentIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expiration Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                <div className="flex items-center">
                  <ClockIcon className="w-4 h-4 text-amber-600 mr-2" />
                  <p className="text-sm text-amber-800">
                    Este convite expira em: <strong>
                      {new Date(inviteLink.expiresAt).toLocaleString('pt-BR')}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={sendByEmail}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <EnvelopeIcon className="w-5 h-5 mr-2" />
                  Enviar por Email
                </button>
                
                <button
                  onClick={copyToClipboard}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                    copied 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-5 h-5 mr-2" />
                      Link Copiado!
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-5 h-5 mr-2" />
                      Copiar Link
                    </>
                  )}
                </button>

                <button
                  onClick={handleClose}
                  className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Fechar
                </button>
              </div>

              {/* Security Note */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Segurança:</strong> Este link contém um token único e seguro. 
                  Compartilhe apenas com a pessoa convidada.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}