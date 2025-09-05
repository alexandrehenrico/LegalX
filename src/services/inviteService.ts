/**
 * Serviço de convites seguros
 * Implementa criação, validação e aceitação de convites com tokens seguros
 */

import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase.config';
import { cryptoService } from './cryptoService';
import { teamService } from './teamService';
import type { Invitation, InviteLink, PendingInvite, Team } from '../types/team';

class InviteService {
  private readonly INVITE_EXPIRY_HOURS = 72; // 3 dias
  private readonly PENDING_INVITE_KEY = 'legalx_pending_invite';

  /**
   * Cria um convite seguro com token criptográfico
   */
  async createInvitation(teamId: string, email: string, role: 'admin' | 'member'): Promise<InviteLink | null> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar se o usuário tem permissão para criar convites
      const canInvite = await teamService.canUserInvite(teamId, currentUser.uid);
      if (!canInvite) {
        throw new Error('Sem permissão para criar convites');
      }

      // Verificar se já existe convite pendente para este email
      const existingInvite = await this.getExistingPendingInvite(teamId, email);
      if (existingInvite) {
        throw new Error('Já existe um convite pendente para este email');
      }

      // Verificar se o usuário já é membro da equipe
      const isAlreadyMember = await teamService.isUserMember(teamId, email);
      if (isAlreadyMember) {
        throw new Error('Este usuário já é membro da equipe');
      }

      // Obter dados da equipe e do criador
      const team = await teamService.getTeamById(teamId);
      if (!team) {
        throw new Error('Equipe não encontrada');
      }

      const inviterName = currentUser.displayName || currentUser.email || 'Administrador';

      // Gerar token seguro e hash
      const token = await cryptoService.generateSecureToken();
      const tokenHash = await cryptoService.hashToken(token);
      const inviteId = cryptoService.generateInviteId();

      // Calcular data de expiração
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.INVITE_EXPIRY_HOURS);

      // Criar documento de convite
      const invitationData: Omit<Invitation, 'id'> = {
        teamId,
        email: email.toLowerCase().trim(),
        role,
        tokenHash, // Salvar apenas o hash, nunca o token
        status: 'pending',
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid,
        metadata: {
          teamName: team.name,
          inviterName
        }
      };

      // Salvar no Firestore com ID customizado
      await doc(db, 'invitations', inviteId).set(invitationData);

      // Gerar URL do convite
      const baseUrl = window.location.origin;
      const inviteUrl = `${baseUrl}/aceitar?inviteId=${inviteId}&token=${token}`;

      console.log('Convite criado com sucesso:', inviteId);

      return {
        inviteId,
        token, // Retornar token apenas para o link
        url: inviteUrl,
        expiresAt: expiresAt.toISOString()
      };

    } catch (error) {
      console.error('Erro ao criar convite:', error);
      throw error;
    }
  }

  /**
   * Obtém metadados públicos de um convite (sem validar token)
   */
  async getInviteMetadata(inviteId: string): Promise<Partial<Invitation> | null> {
    try {
      const inviteDoc = await getDoc(doc(db, 'invitations', inviteId));
      
      if (!inviteDoc.exists()) {
        return null;
      }

      const data = inviteDoc.data() as Invitation;
      
      // Retornar apenas metadados públicos (sem tokenHash)
      return {
        id: inviteDoc.id,
        teamId: data.teamId,
        email: data.email,
        role: data.role,
        status: data.status,
        expiresAt: data.expiresAt,
        createdAt: data.createdAt,
        metadata: data.metadata
      };

    } catch (error) {
      console.error('Erro ao buscar metadados do convite:', error);
      return null;
    }
  }

  /**
   * Aceita um convite usando token de validação
   */
  async acceptInvitation(inviteId: string, token: string): Promise<{ success: boolean; message: string }> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('Usuário não autenticado ou sem email');
      }

      // Buscar convite
      const inviteDoc = await getDoc(doc(db, 'invitations', inviteId));
      if (!inviteDoc.exists()) {
        return { success: false, message: 'Convite não encontrado' };
      }

      const invitation = { id: inviteDoc.id, ...inviteDoc.data() } as Invitation;

      // Verificar status
      if (invitation.status !== 'pending') {
        return { success: false, message: 'Este convite já foi processado ou cancelado' };
      }

      // Verificar expiração
      if (new Date() > new Date(invitation.expiresAt)) {
        await updateDoc(doc(db, 'invitations', inviteId), {
          status: 'expired',
          updatedAt: serverTimestamp()
        });
        return { success: false, message: 'Este convite expirou' };
      }

      // Verificar token
      const isValidToken = await cryptoService.verifyToken(token, invitation.tokenHash);
      if (!isValidToken) {
        return { success: false, message: 'Token de convite inválido' };
      }

      // Verificar email (case-insensitive)
      const userEmail = currentUser.email.toLowerCase().trim();
      const inviteEmail = invitation.email.toLowerCase().trim();
      
      if (userEmail !== inviteEmail) {
        return { 
          success: false, 
          message: `Este convite foi enviado para ${invitation.email}, mas você está logado como ${currentUser.email}` 
        };
      }

      // Verificar se já é membro
      const isAlreadyMember = await teamService.isUserMemberByUid(invitation.teamId, currentUser.uid);
      if (isAlreadyMember) {
        return { success: false, message: 'Você já é membro desta equipe' };
      }

      // Usar transação para atomicidade
      const batch = writeBatch(db);

      // Criar membro da equipe
      const memberRef = doc(collection(db, 'teams', invitation.teamId, 'members'));
      batch.set(memberRef, {
        uid: currentUser.uid,
        email: userEmail,
        role: invitation.role,
        status: 'active',
        joinedAt: serverTimestamp(),
        invitedBy: invitation.createdBy
      });

      // Criar referência na subcoleção do usuário
      const userTeamRef = doc(collection(db, 'users', currentUser.uid, 'teams'));
      batch.set(userTeamRef, {
        teamId: invitation.teamId,
        role: invitation.role,
        status: 'active',
        joinedAt: serverTimestamp()
      });

      // Marcar convite como aceito
      const inviteRef = doc(db, 'invitations', inviteId);
      batch.update(inviteRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        acceptedBy: currentUser.uid
      });

      // Executar transação
      await batch.commit();

      // Limpar convite pendente do localStorage
      this.clearPendingInvite();

      console.log('Convite aceito com sucesso:', inviteId);
      return { success: true, message: 'Convite aceito com sucesso!' };

    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erro interno ao aceitar convite' 
      };
    }
  }

  /**
   * Salva convite pendente no localStorage para processar após login
   */
  savePendingInvite(inviteId: string, token: string): void {
    const pendingInvite: PendingInvite = {
      inviteId,
      token,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(this.PENDING_INVITE_KEY, JSON.stringify(pendingInvite));
    console.log('Convite pendente salvo para processar após login');
  }

  /**
   * Recupera convite pendente do localStorage
   */
  getPendingInvite(): PendingInvite | null {
    try {
      const stored = localStorage.getItem(this.PENDING_INVITE_KEY);
      if (!stored) return null;

      const pendingInvite = JSON.parse(stored) as PendingInvite;
      
      // Verificar se não expirou (máximo 1 hora no localStorage)
      const timestamp = new Date(pendingInvite.timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 1) {
        this.clearPendingInvite();
        return null;
      }

      return pendingInvite;
    } catch (error) {
      console.error('Erro ao recuperar convite pendente:', error);
      this.clearPendingInvite();
      return null;
    }
  }

  /**
   * Remove convite pendente do localStorage
   */
  clearPendingInvite(): void {
    localStorage.removeItem(this.PENDING_INVITE_KEY);
  }

  /**
   * Cancela um convite
   */
  async cancelInvitation(inviteId: string): Promise<boolean> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      const inviteRef = doc(db, 'invitations', inviteId);
      const inviteDoc = await getDoc(inviteRef);
      
      if (!inviteDoc.exists()) {
        throw new Error('Convite não encontrado');
      }

      const invitation = inviteDoc.data() as Invitation;
      
      // Verificar permissão (criador ou owner da equipe)
      const canCancel = invitation.createdBy === currentUser.uid || 
                       await teamService.isTeamOwner(invitation.teamId, currentUser.uid);
      
      if (!canCancel) {
        throw new Error('Sem permissão para cancelar este convite');
      }

      await updateDoc(inviteRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp()
      });

      console.log('Convite cancelado:', inviteId);
      return true;

    } catch (error) {
      console.error('Erro ao cancelar convite:', error);
      throw error;
    }
  }

  /**
   * Lista convites de uma equipe
   */
  async getTeamInvitations(teamId: string): Promise<Invitation[]> {
    try {
      const q = query(
        collection(db, 'invitations'),
        where('teamId', '==', teamId),
        where('status', 'in', ['pending', 'accepted'])
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        expiresAt: doc.data().expiresAt?.toDate?.()?.toISOString() || doc.data().expiresAt,
        acceptedAt: doc.data().acceptedAt?.toDate?.()?.toISOString() || doc.data().acceptedAt
      })) as Invitation[];

    } catch (error) {
      console.error('Erro ao buscar convites da equipe:', error);
      return [];
    }
  }

  /**
   * Verifica se existe convite pendente para um email
   */
  private async getExistingPendingInvite(teamId: string, email: string): Promise<Invitation | null> {
    try {
      const q = query(
        collection(db, 'invitations'),
        where('teamId', '==', teamId),
        where('email', '==', email.toLowerCase().trim()),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Invitation;

    } catch (error) {
      console.error('Erro ao verificar convite existente:', error);
      return null;
    }
  }

  /**
   * Processa convite pendente após login/signup
   */
  async processPendingInvite(): Promise<{ success: boolean; message: string } | null> {
    const pendingInvite = this.getPendingInvite();
    if (!pendingInvite) {
      return null;
    }

    console.log('Processando convite pendente:', pendingInvite.inviteId);
    
    try {
      const result = await this.acceptInvitation(pendingInvite.inviteId, pendingInvite.token);
      return result;
    } catch (error) {
      console.error('Erro ao processar convite pendente:', error);
      this.clearPendingInvite();
      return { success: false, message: 'Erro ao processar convite pendente' };
    }
  }

  /**
   * Gera novo link para convite existente (re-envio)
   */
  async regenerateInviteLink(inviteId: string): Promise<InviteLink | null> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      const inviteDoc = await getDoc(doc(db, 'invitations', inviteId));
      if (!inviteDoc.exists()) {
        throw new Error('Convite não encontrado');
      }

      const invitation = inviteDoc.data() as Invitation;
      
      // Verificar permissão
      const canRegenerate = invitation.createdBy === currentUser.uid || 
                           await teamService.isTeamOwner(invitation.teamId, currentUser.uid);
      
      if (!canRegenerate) {
        throw new Error('Sem permissão para regenerar este convite');
      }

      // Verificar se ainda está pendente
      if (invitation.status !== 'pending') {
        throw new Error('Apenas convites pendentes podem ser regenerados');
      }

      // Gerar novo token e hash
      const newToken = await cryptoService.generateSecureToken();
      const newTokenHash = await cryptoService.hashToken(newToken);

      // Estender expiração
      const newExpiresAt = new Date();
      newExpiresAt.setHours(newExpiresAt.getHours() + this.INVITE_EXPIRY_HOURS);

      // Atualizar convite
      await updateDoc(doc(db, 'invitations', inviteId), {
        tokenHash: newTokenHash,
        expiresAt: newExpiresAt.toISOString(),
        updatedAt: serverTimestamp()
      });

      // Gerar nova URL
      const baseUrl = window.location.origin;
      const newInviteUrl = `${baseUrl}/aceitar?inviteId=${inviteId}&token=${newToken}`;

      console.log('Link de convite regenerado:', inviteId);

      return {
        inviteId,
        token: newToken,
        url: newInviteUrl,
        expiresAt: newExpiresAt.toISOString()
      };

    } catch (error) {
      console.error('Erro ao regenerar link de convite:', error);
      throw error;
    }
  }
}

export const inviteService = new InviteService();