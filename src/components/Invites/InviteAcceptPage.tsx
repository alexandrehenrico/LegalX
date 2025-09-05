/**
 * Página para aceitar convites via link seguro
 * Suporta usuários não autenticados e fluxo de signup/login
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { inviteService } from '../../services/inviteService';
import { authService } from '../../services/authService';
import type { Invitation, User } from '../../types';
import { 
  UserGroupIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function InviteAcceptPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [invitation, setInvitation] = useState<Partial<Invitation> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const inviteId = searchParams.get('inviteId');
  const token = searchParams.get('token');

  useEffect(() => {
    // Verificar usuário atual
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    if (!inviteId || !token) {
      setError('Link de convite inválido');
      setLoading(false);
      return;
    }

    loadInviteMetadata();
  }, [inviteId, token]);

  const loadInviteMetadata = async () => {
    if (!inviteId) return;

    try {
      setLoading(true);
      const metadata = await inviteService.getInviteMetadata(inviteId);
      
      if (!metadata) {
        setError('Convite não encontrado');
        return;
      }

      if (metadata.status === 'accepted') {
        setError('Este convite já foi aceito');
        return;
      }

      if (metadata.status === 'cancelled') {
        setError('Este convite foi cancelado');
        return;
      }

      if (metadata.status === 'expired' || (metadata.expiresAt && new Date() > new Date(metadata.expiresAt))) {
        setError('Este convite expirou');
        return;
      }

      setInvitation(metadata);

    } catch (error) {
      console.error('Erro ao carregar convite:', error);
      setError('Erro ao carregar informações do convite');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!inviteId || !token) return;

    if (!currentUser) {
      // Salvar convite pendente e redirecionar para login
      inviteService.savePendingInvite(inviteId, token);
      navigate('/login?redirect=accept-invite');
      return;
    }

    try {
      setAccepting(true);
      const result = await inviteService.acceptInvitation(inviteId, token);
      
      if (result.success) {
        // Redirecionar para dashboard da equipe
        navigate(`/dashboard?team=${invitation?.teamId}&invited=true`);
      } else {
        setError(result.message);
      }

    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
      setError('Erro interno ao aceitar convite');
    } finally {
      setAccepting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const getRoleDisplayName = (role: string) => {
    const roles = {
      'owner': 'Proprietário',
      'admin': 'Administrador',
      'member': 'Membro'
    };
    return roles[role as keyof typeof roles] || role;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Convite Inválido</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Legal<span className="text-amber-400">X</span>
          </h1>
          <p className="text-blue-200">Sistema de Gestão Jurídica</p>
        </div>

        {/* Invite Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <UserGroupIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Convite para Equipe</h2>
            <p className="text-gray-600 mt-2">Você foi convidado para participar de uma equipe</p>
          </div>

          {/* Invite Details */}
          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Equipe</span>
                <UserGroupIcon className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-lg font-bold text-blue-900">{invitation.metadata?.teamName}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">Função</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {getRoleDisplayName(invitation.role || '')}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">Expira em</span>
                  <ClockIcon className="w-3 h-3 text-gray-500" />
                </div>
                <p className="text-xs text-gray-700">
                  {invitation.expiresAt ? formatDate(invitation.expiresAt) : 'N/A'}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">Convidado por</span>
              </div>
              <p className="text-sm text-gray-900">{invitation.metadata?.inviterName}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">Email do convite</span>
              </div>
              <p className="text-sm text-gray-900">{invitation.email}</p>
            </div>
          </div>

          {/* Current User Info */}
          {currentUser && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-900">Logado como</p>
                  <p className="text-sm text-green-700">{currentUser.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Email Mismatch Warning */}
          {currentUser && currentUser.email?.toLowerCase() !== invitation.email?.toLowerCase() && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Atenção</p>
                  <p className="text-sm text-amber-700">
                    Este convite foi enviado para <strong>{invitation.email}</strong>, 
                    mas você está logado como <strong>{currentUser.email}</strong>.
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Você precisa estar logado com o email correto para aceitar o convite.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {!currentUser ? (
              <>
                <button
                  onClick={handleAcceptInvite}
                  disabled={accepting}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  <ArrowRightIcon className="w-5 h-5 mr-2" />
                  Fazer Login para Aceitar
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Você será redirecionado para fazer login ou criar uma conta
                </p>
              </>
            ) : currentUser.email?.toLowerCase() === invitation.email?.toLowerCase() ? (
              <button
                onClick={handleAcceptInvite}
                disabled={accepting}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                {accepting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Aceitando...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Aceitar Convite
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    authService.logout();
                    // Após logout, a página será recarregada e o fluxo de login será iniciado
                  }}
                  className="w-full bg-amber-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-amber-700 transition-colors"
                >
                  Fazer Login com Email Correto
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Você precisa estar logado com {invitation.email} para aceitar este convite
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Este convite expira em {invitation.expiresAt ? formatDate(invitation.expiresAt) : 'data não definida'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}