/**
 * Serviço de equipes com suporte a múltiplas memberships
 * Implementa novo esquema: teams/{teamId}/members/{memberId}
 */

import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase.config';
import type { Team, TeamMember, UserTeam } from '../types/team';

class TeamService {
  
  /**
   * Cria uma nova equipe
   */
  async createTeam(teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt' | 'ownerUid'>): Promise<Team | null> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      const batch = writeBatch(db);

      // Criar equipe
      const teamRef = doc(collection(db, 'teams'));
      const newTeam: Omit<Team, 'id'> = {
        ...teamData,
        ownerUid: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: {
          allowInvites: true,
          maxMembers: 50,
          ...teamData.settings
        }
      };
      batch.set(teamRef, newTeam);

      // Adicionar owner como membro
      const memberRef = doc(collection(db, 'teams', teamRef.id, 'members'));
      batch.set(memberRef, {
        uid: currentUser.uid,
        email: currentUser.email,
        role: 'owner',
        status: 'active',
        joinedAt: serverTimestamp()
      });

      // Adicionar referência na subcoleção do usuário
      const userTeamRef = doc(collection(db, 'users', currentUser.uid, 'teams'));
      batch.set(userTeamRef, {
        teamId: teamRef.id,
        role: 'owner',
        status: 'active',
        joinedAt: serverTimestamp()
      });

      await batch.commit();

      const createdTeam: Team = {
        id: teamRef.id,
        ...newTeam
      };

      console.log('Equipe criada com sucesso:', createdTeam.name);
      return createdTeam;

    } catch (error) {
      console.error('Erro ao criar equipe:', error);
      return null;
    }
  }

  /**
   * Busca equipe por ID
   */
  async getTeamById(teamId: string): Promise<Team | null> {
    try {
      const teamDoc = await getDoc(doc(db, 'teams', teamId));
      
      if (!teamDoc.exists()) {
        return null;
      }

      return {
        id: teamDoc.id,
        ...teamDoc.data(),
        createdAt: teamDoc.data().createdAt?.toDate?.()?.toISOString() || teamDoc.data().createdAt,
        updatedAt: teamDoc.data().updatedAt?.toDate?.()?.toISOString() || teamDoc.data().updatedAt
      } as Team;

    } catch (error) {
      console.error('Erro ao buscar equipe:', error);
      return null;
    }
  }

  /**
   * Lista equipes do usuário atual
   */
  async getUserTeams(): Promise<Team[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return [];
      }

      // Buscar equipes através da subcoleção do usuário
      const userTeamsSnapshot = await getDocs(
        collection(db, 'users', currentUser.uid, 'teams')
      );

      const teamIds = userTeamsSnapshot.docs
        .map(doc => doc.data().teamId)
        .filter(Boolean);

      if (teamIds.length === 0) {
        return [];
      }

      // Buscar dados completos das equipes
      const teams: Team[] = [];
      for (const teamId of teamIds) {
        const team = await this.getTeamById(teamId);
        if (team) {
          teams.push(team);
        }
      }

      return teams.sort((a, b) => a.name.localeCompare(b.name));

    } catch (error) {
      console.error('Erro ao buscar equipes do usuário:', error);
      return [];
    }
  }

  /**
   * Lista membros de uma equipe
   */
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    try {
      const membersSnapshot = await getDocs(
        query(
          collection(db, 'teams', teamId, 'members'),
          orderBy('joinedAt', 'desc')
        )
      );

      return membersSnapshot.docs.map(doc => ({
        id: doc.id,
        teamId,
        ...doc.data(),
        joinedAt: doc.data().joinedAt?.toDate?.()?.toISOString() || doc.data().joinedAt
      })) as TeamMember[];

    } catch (error) {
      console.error('Erro ao buscar membros da equipe:', error);
      return [];
    }
  }

  /**
   * Verifica se usuário pode criar convites
   */
  async canUserInvite(teamId: string, uid: string): Promise<boolean> {
    try {
      // Verificar se é owner da equipe
      const team = await this.getTeamById(teamId);
      if (team?.ownerUid === uid) {
        return true;
      }

      // Verificar se é admin
      const memberSnapshot = await getDocs(
        query(
          collection(db, 'teams', teamId, 'members'),
          where('uid', '==', uid),
          where('status', '==', 'active')
        )
      );

      if (memberSnapshot.empty) {
        return false;
      }

      const member = memberSnapshot.docs[0].data() as TeamMember;
      return member.role === 'admin' || member.role === 'owner';

    } catch (error) {
      console.error('Erro ao verificar permissão de convite:', error);
      return false;
    }
  }

  /**
   * Verifica se usuário é owner da equipe
   */
  async isTeamOwner(teamId: string, uid: string): Promise<boolean> {
    try {
      const team = await this.getTeamById(teamId);
      return team?.ownerUid === uid;
    } catch (error) {
      console.error('Erro ao verificar ownership:', error);
      return false;
    }
  }

  /**
   * Verifica se usuário é membro da equipe (por email)
   */
  async isUserMember(teamId: string, email: string): Promise<boolean> {
    try {
      const memberSnapshot = await getDocs(
        query(
          collection(db, 'teams', teamId, 'members'),
          where('email', '==', email.toLowerCase().trim()),
          where('status', '==', 'active')
        )
      );

      return !memberSnapshot.empty;

    } catch (error) {
      console.error('Erro ao verificar membership por email:', error);
      return false;
    }
  }

  /**
   * Verifica se usuário é membro da equipe (por UID)
   */
  async isUserMemberByUid(teamId: string, uid: string): Promise<boolean> {
    try {
      const memberSnapshot = await getDocs(
        query(
          collection(db, 'teams', teamId, 'members'),
          where('uid', '==', uid),
          where('status', '==', 'active')
        )
      );

      return !memberSnapshot.empty;

    } catch (error) {
      console.error('Erro ao verificar membership por UID:', error);
      return false;
    }
  }

  /**
   * Remove membro da equipe
   */
  async removeMember(teamId: string, memberId: string): Promise<boolean> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar permissão (owner ou admin)
      const canRemove = await this.canUserInvite(teamId, currentUser.uid);
      if (!canRemove) {
        throw new Error('Sem permissão para remover membros');
      }

      // Buscar dados do membro
      const memberDoc = await getDoc(doc(db, 'teams', teamId, 'members', memberId));
      if (!memberDoc.exists()) {
        throw new Error('Membro não encontrado');
      }

      const member = memberDoc.data() as TeamMember;

      // Não permitir remover o owner
      if (member.role === 'owner') {
        throw new Error('Não é possível remover o proprietário da equipe');
      }

      const batch = writeBatch(db);

      // Remover da equipe
      batch.delete(doc(db, 'teams', teamId, 'members', memberId));

      // Remover da subcoleção do usuário
      const userTeamsSnapshot = await getDocs(
        query(
          collection(db, 'users', member.uid, 'teams'),
          where('teamId', '==', teamId)
        )
      );

      userTeamsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log('Membro removido da equipe:', memberId);
      return true;

    } catch (error) {
      console.error('Erro ao remover membro:', error);
      throw error;
    }
  }

  /**
   * Atualiza role de um membro
   */
  async updateMemberRole(teamId: string, memberId: string, newRole: 'admin' | 'member'): Promise<boolean> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      // Apenas owner pode alterar roles
      const isOwner = await this.isTeamOwner(teamId, currentUser.uid);
      if (!isOwner) {
        throw new Error('Apenas o proprietário pode alterar funções');
      }

      const batch = writeBatch(db);

      // Atualizar na equipe
      const memberRef = doc(db, 'teams', teamId, 'members', memberId);
      batch.update(memberRef, {
        role: newRole,
        updatedAt: serverTimestamp()
      });

      // Buscar e atualizar na subcoleção do usuário
      const memberDoc = await getDoc(memberRef);
      if (memberDoc.exists()) {
        const member = memberDoc.data() as TeamMember;
        
        const userTeamsSnapshot = await getDocs(
          query(
            collection(db, 'users', member.uid, 'teams'),
            where('teamId', '==', teamId)
          )
        );

        userTeamsSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            role: newRole,
            updatedAt: serverTimestamp()
          });
        });
      }

      await batch.commit();

      console.log('Role do membro atualizada:', memberId, newRole);
      return true;

    } catch (error) {
      console.error('Erro ao atualizar role do membro:', error);
      throw error;
    }
  }
}

export const teamService = new TeamService();