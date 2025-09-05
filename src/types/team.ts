/**
 * Tipos para sistema de equipes e convites seguros
 */

export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerUid: string;
  createdAt: string;
  updatedAt: string;
  settings: {
    allowInvites: boolean;
    maxMembers: number;
  };
}

export interface TeamMember {
  id: string;
  teamId: string;
  uid: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'inactive';
  joinedAt: string;
  invitedBy?: string;
}

export interface UserTeam {
  teamId: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'inactive';
  joinedAt: string;
}

export interface Invitation {
  id: string;
  teamId: string;
  email: string;
  role: 'admin' | 'member';
  tokenHash: string; // Hash SHA-256 do token, nunca o token em texto puro
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expiresAt: string;
  createdAt: string;
  createdBy: string;
  acceptedAt?: string;
  acceptedBy?: string;
  metadata: {
    teamName: string;
    inviterName: string;
  };
}

export interface PendingInvite {
  inviteId: string;
  token: string;
  timestamp: string;
}

export interface InviteLink {
  inviteId: string;
  token: string;
  url: string;
  expiresAt: string;
}