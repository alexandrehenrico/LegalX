/**
 * Cloud Functions para LegalX
 * 
 * IMPORTANTE: Estas funções requerem o plano Blaze do Firebase
 * Para o plano Spark, use o fallback de envio manual via mailto:
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as sgMail from '@sendgrid/mail';
import { createHash } from 'crypto';

// Inicializar Firebase Admin
admin.initializeApp();

// Configurar SendGrid (requer variável de ambiente)
const sendGridApiKey = functions.config().sendgrid?.api_key;
if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
}

/**
 * Função para envio de email de convite
 * REQUER PLANO BLAZE - Use fallback manual no Spark
 */
export const sendInviteEmail = functions.https.onCall(async (data, context) => {
  // Verificar autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const { inviteId } = data;

  if (!inviteId) {
    throw new functions.https.HttpsError('invalid-argument', 'inviteId é obrigatório');
  }

  try {
    // Buscar dados do convite
    const inviteDoc = await admin.firestore().collection('invitations').doc(inviteId).get();
    
    if (!inviteDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Convite não encontrado');
    }

    const invitation = inviteDoc.data()!;

    // Verificar permissão (criador ou owner da equipe)
    const teamDoc = await admin.firestore().collection('teams').doc(invitation.teamId).get();
    const team = teamDoc.data()!;

    const canSend = invitation.createdBy === context.auth.uid || team.ownerUid === context.auth.uid;
    
    if (!canSend) {
      throw new functions.https.HttpsError('permission-denied', 'Sem permissão para enviar este convite');
    }

    // Verificar se SendGrid está configurado
    if (!sendGridApiKey) {
      throw new functions.https.HttpsError('failed-precondition', 'Serviço de email não configurado');
    }

    // Gerar novo token para o email (por segurança)
    const newToken = generateSecureToken();
    const newTokenHash = hashToken(newToken);

    // Atualizar convite com novo token
    await inviteDoc.ref.update({
      tokenHash: newTokenHash,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Gerar link de convite
    const baseUrl = functions.config().app?.base_url || 'https://legalx.com';
    const inviteUrl = `${baseUrl}/aceitar?inviteId=${inviteId}&token=${newToken}`;

    // Preparar email
    const emailData = {
      to: invitation.email,
      from: functions.config().sendgrid?.sender_email || 'noreply@legalx.com',
      subject: `Convite para ${invitation.metadata.teamName} - LegalX`,
      html: generateInviteEmailHTML(invitation, inviteUrl)
    };

    // Enviar email
    await sgMail.send(emailData);

    console.log('Email de convite enviado:', invitation.email);

    return { 
      success: true, 
      message: 'Email enviado com sucesso',
      sentTo: invitation.email 
    };

  } catch (error) {
    console.error('Erro ao enviar email de convite:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Erro interno ao enviar email');
  }
});

/**
 * Função para validar token de convite (alternativa às regras Firestore)
 * Útil para validações complexas que não cabem nas regras
 */
export const validateInviteToken = functions.https.onCall(async (data, context) => {
  const { inviteId, token } = data;

  if (!inviteId || !token) {
    throw new functions.https.HttpsError('invalid-argument', 'inviteId e token são obrigatórios');
  }

  try {
    // Buscar convite
    const inviteDoc = await admin.firestore().collection('invitations').doc(inviteId).get();
    
    if (!inviteDoc.exists) {
      return { valid: false, reason: 'Convite não encontrado' };
    }

    const invitation = inviteDoc.data()!;

    // Verificar status
    if (invitation.status !== 'pending') {
      return { valid: false, reason: 'Convite já processado' };
    }

    // Verificar expiração
    const expiresAt = invitation.expiresAt.toDate ? invitation.expiresAt.toDate() : new Date(invitation.expiresAt);
    if (new Date() > expiresAt) {
      // Marcar como expirado
      await inviteDoc.ref.update({
        status: 'expired',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { valid: false, reason: 'Convite expirado' };
    }

    // Verificar token
    const tokenHash = hashToken(token);
    if (tokenHash !== invitation.tokenHash) {
      return { valid: false, reason: 'Token inválido' };
    }

    return { 
      valid: true, 
      invitation: {
        email: invitation.email,
        teamId: invitation.teamId,
        role: invitation.role,
        metadata: invitation.metadata
      }
    };

  } catch (error) {
    console.error('Erro ao validar token:', error);
    throw new functions.https.HttpsError('internal', 'Erro interno na validação');
  }
});

/**
 * Função para aceitar convite de forma segura
 * Alternativa para casos onde as regras Firestore não são suficientes
 */
export const acceptInviteSecure = functions.https.onCall(async (data, context) => {
  // Verificar autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const { inviteId, token } = data;

  if (!inviteId || !token) {
    throw new functions.https.HttpsError('invalid-argument', 'inviteId e token são obrigatórios');
  }

  try {
    // Validar token primeiro
    const validation = await validateInviteToken.handler({ inviteId, token }, context);
    
    if (!validation.valid) {
      return { success: false, message: validation.reason };
    }

    const invitation = validation.invitation;
    const userEmail = context.auth.token.email?.toLowerCase().trim();
    const inviteEmail = invitation.email.toLowerCase().trim();

    // Verificar email
    if (userEmail !== inviteEmail) {
      return { 
        success: false, 
        message: `Convite enviado para ${invitation.email}, mas você está logado como ${userEmail}` 
      };
    }

    // Verificar se já é membro
    const existingMember = await admin.firestore()
      .collection('teams').doc(invitation.teamId)
      .collection('members')
      .where('uid', '==', context.auth.uid)
      .where('status', '==', 'active')
      .get();

    if (!existingMember.empty) {
      return { success: false, message: 'Você já é membro desta equipe' };
    }

    // Usar transação para atomicidade
    const result = await admin.firestore().runTransaction(async (transaction) => {
      // Criar membro da equipe
      const memberRef = admin.firestore()
        .collection('teams').doc(invitation.teamId)
        .collection('members').doc();
      
      transaction.set(memberRef, {
        uid: context.auth!.uid,
        email: userEmail,
        role: invitation.role,
        status: 'active',
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        invitedBy: invitation.createdBy
      });

      // Criar referência na subcoleção do usuário
      const userTeamRef = admin.firestore()
        .collection('users').doc(context.auth!.uid)
        .collection('teams').doc();
      
      transaction.set(userTeamRef, {
        teamId: invitation.teamId,
        role: invitation.role,
        status: 'active',
        joinedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Marcar convite como aceito
      const inviteRef = admin.firestore().collection('invitations').doc(inviteId);
      transaction.update(inviteRef, {
        status: 'accepted',
        acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        acceptedBy: context.auth!.uid
      });

      return { success: true, message: 'Convite aceito com sucesso!' };
    });

    console.log('Convite aceito via Cloud Function:', inviteId);
    return result;

  } catch (error) {
    console.error('Erro ao aceitar convite:', error);
    throw new functions.https.HttpsError('internal', 'Erro interno ao aceitar convite');
  }
});

// Funções auxiliares
function generateSecureToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateInviteEmailHTML(invitation: any, inviteUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Convite para ${invitation.metadata.teamName}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Legal<span style="color: #f59e0b;">X</span></h1>
          <p>Sistema de Gestão Jurídica</p>
        </div>
        <div class="content">
          <h2>Você foi convidado para uma equipe!</h2>
          <p>Olá!</p>
          <p><strong>${invitation.metadata.inviterName}</strong> convidou você para participar da equipe <strong>"${invitation.metadata.teamName}"</strong> no LegalX.</p>
          
          <p><strong>Sua função:</strong> ${invitation.role === 'admin' ? 'Administrador' : 'Membro'}</p>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" class="button">Aceitar Convite</a>
          </p>
          
          <p><strong>Importante:</strong></p>
          <ul>
            <li>Este convite expira em: <strong>${new Date(invitation.expiresAt).toLocaleString('pt-BR')}</strong></li>
            <li>O link é único e seguro - não compartilhe com terceiros</li>
            <li>Se você não solicitou este convite, pode ignorar este email</li>
          </ul>
          
          <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
            ${inviteUrl}
          </p>
        </div>
        <div class="footer">
          <p>Este email foi enviado pelo LegalX - Sistema de Gestão Jurídica</p>
          <p>Se você não deseja mais receber estes emails, entre em contato conosco.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}