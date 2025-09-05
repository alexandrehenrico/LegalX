/**
 * Lista de convites pendentes com ações de gerenciamento
 */

import React, { useState, useEffect } from 'react';
import { inviteService } from '../../services/inviteService';
import type { Invitation } from '../../types/team';
import { 
  ClockIcon, 
  XMarkIcon, 
  ArrowPathIcon,
  EnvelopeIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TeamInvitesListProps {
  teamId: string;
  onInviteUpdated: () => void;
}

export default function TeamInvitesList({ teamId, onInviteUpdated }: TeamInvitesListProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, [teamId]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const invites = await inviteService.getTeamInvitations(teamId);
      setInvitations(invites.filter(i => i.status === 'pending'));
    } catch (error) {
      console.error('Erro ao carregar convites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este convite?')) {
      return;
    }

    try {
      setActionLoading(inviteId);
      await inviteService.cancelInvitation(inviteId);
      await loadInvitations();
      onInviteUpdated();
    } catch (error) {
      console.error('Erro ao cancelar convite:', error);
      alert('Erro ao cancelar convite');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegenerateLink = async (inviteId: string) => {
    try {
      setActionLoading(inviteId);
      const newLink = await inviteService.regenerateInviteLink(inviteId);
      
      if (newLink) {
        // Copiar novo link
        await navigator.clipboard.writeText(newLink.url);
        alert('Novo link gerado e copiado para a área de transferência!');
        await loadInvitations();
      }
    } catch (error) {
      console.error('Erro ao regenerar link:', error);
      alert('Erro ao regenerar link');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const getRoleDisplayName = (role: string) => {
    const roles = {
      'admin': 'Administrador',
      'member': 'Membro'
    };
    return roles[role as keyof typeof roles] || role;
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry <= 24; // Menos de 24 horas
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Convites Pendentes</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Carregando convites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Convites Pendentes ({invitations.length})
      </h3>

      {invitations.length === 0 ? (
        <div className="text-center py-8">
          <EnvelopeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum convite pendente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div 
              key={invitation.id} 
              className={`border rounded-lg p-4 ${
                isExpiringSoon(invitation.expiresAt) 
                  ? 'border-amber-200 bg-amber-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <p className="font-medium text-gray-900">{invitation.email}</p>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {getRoleDisplayName(invitation.role)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Convidado por: {invitation.metadata.inviterName}</p>
                    <div className="flex items-center">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      <span>
                        Expira: {formatDate(invitation.expiresAt)}
                        {isExpiringSoon(invitation.expiresAt) && (
                          <span className="text-amber-600 font-medium ml-1">(expira em breve)</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleRegenerateLink(invitation.id)}
                    disabled={actionLoading === invitation.id}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                    title="Regenerar link"
                  >
                    {actionLoading === invitation.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : (
                      <ArrowPathIcon className="w-4 h-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleCancelInvite(invitation.id)}
                    disabled={actionLoading === invitation.id}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                    title="Cancelar convite"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}