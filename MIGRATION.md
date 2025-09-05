# Migração para Sistema de Convites Seguros + Múltiplas Equipes

## Visão Geral

Este documento descreve a migração do sistema de convites simples para um sistema seguro com tokens criptográficos e suporte a múltiplas equipes por usuário.

## Principais Mudanças

### 1. Estrutura de Dados

**Antes:**
```
teamMembers/{userId} -> { teamId, role, status }
```

**Depois:**
```
teams/{teamId}/members/{memberId} -> { uid, email, role, status, joinedAt }
users/{userId}/teams/{teamId} -> { teamId, role, status, joinedAt }
```

### 2. Sistema de Convites

**Antes:**
- `inviteId` público
- Sem validação de token
- Envio via `mailto:`

**Depois:**
- Token criptográfico seguro (SHA-256)
- Validação rigorosa de email e token
- Links com expiração
- Suporte a usuários não cadastrados

## Passos de Migração

### Passo 1: Backup dos Dados Atuais

```javascript
// Execute no console do navegador ANTES da migração
const backupTeamMembers = [];
const snapshot = await firebase.firestore().collection('teamMembers').get();
snapshot.docs.forEach(doc => {
  backupTeamMembers.push({ id: doc.id, ...doc.data() });
});
console.log('Backup:', JSON.stringify(backupTeamMembers, null, 2));
// Salve este JSON em um arquivo seguro
```

### Passo 2: Migração Automática (Executar uma vez)

```javascript
// Script de migração - execute no console após deploy
async function migrateTeamMembers() {
  const db = firebase.firestore();
  const batch = db.batch();
  
  try {
    // 1. Buscar todos os membros antigos
    const oldMembersSnapshot = await db.collection('teamMembers').get();
    
    console.log(`Migrando ${oldMembersSnapshot.size} membros...`);
    
    for (const doc of oldMembersSnapshot.docs) {
      const oldMember = doc.data();
      const userId = doc.id;
      
      // 2. Criar membro na nova estrutura
      const newMemberRef = db.collection('teams').doc(oldMember.teamId)
                            .collection('members').doc();
      
      batch.set(newMemberRef, {
        uid: userId,
        email: oldMember.email || '', // Pode precisar ser preenchido manualmente
        role: oldMember.role,
        status: oldMember.status,
        joinedAt: oldMember.joinedAt || firebase.firestore.FieldValue.serverTimestamp(),
        migratedFrom: doc.id // Para rastreamento
      });
      
      // 3. Criar referência na subcoleção do usuário
      const userTeamRef = db.collection('users').doc(userId)
                           .collection('teams').doc();
      
      batch.set(userTeamRef, {
        teamId: oldMember.teamId,
        role: oldMember.role,
        status: oldMember.status,
        joinedAt: oldMember.joinedAt || firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // 4. Executar migração
    await batch.commit();
    console.log('Migração concluída com sucesso!');
    
    // 5. Verificar migração
    const verification = await verifyMigration();
    console.log('Verificação:', verification);
    
  } catch (error) {
    console.error('Erro na migração:', error);
  }
}

async function verifyMigration() {
  const db = firebase.firestore();
  
  const oldCount = (await db.collection('teamMembers').get()).size;
  
  let newCount = 0;
  const teamsSnapshot = await db.collection('teams').get();
  
  for (const teamDoc of teamsSnapshot.docs) {
    const membersSnapshot = await teamDoc.ref.collection('members').get();
    newCount += membersSnapshot.size;
  }
  
  return {
    oldMembers: oldCount,
    newMembers: newCount,
    migrationComplete: oldCount === newCount
  };
}

// Executar migração
migrateTeamMembers();
```

### Passo 3: Limpeza (Após Verificação)

```javascript
// APENAS após confirmar que a migração funcionou
async function cleanupOldData() {
  const db = firebase.firestore();
  const batch = db.batch();
  
  const oldMembersSnapshot = await db.collection('teamMembers').get();
  
  oldMembersSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log('Dados antigos removidos');
}

// cleanupOldData(); // Descomente apenas após verificar migração
```

## Verificação da Migração

### 1. Verificar Estrutura de Dados

```javascript
// Verificar se as novas coleções foram criadas
async function checkNewStructure() {
  const db = firebase.firestore();
  
  // Verificar equipes
  const teams = await db.collection('teams').limit(1).get();
  console.log('Teams collection exists:', !teams.empty);
  
  // Verificar membros
  if (!teams.empty) {
    const teamId = teams.docs[0].id;
    const members = await db.collection('teams').doc(teamId).collection('members').get();
    console.log(`Team ${teamId} has ${members.size} members`);
  }
  
  // Verificar convites
  const invites = await db.collection('invitations').limit(1).get();
  console.log('Invitations collection exists:', !invites.empty);
}

checkNewStructure();
```

### 2. Testar Funcionalidades

1. **Criar Convite:**
   - Acesse uma equipe como admin/owner
   - Clique em "Convidar Membro"
   - Verifique se o link é gerado corretamente

2. **Aceitar Convite (Usuário Existente):**
   - Abra o link em uma aba anônima
   - Faça login com o email correto
   - Verifique se o usuário é adicionado à equipe

3. **Aceitar Convite (Usuário Novo):**
   - Abra o link em uma aba anônima
   - Crie uma conta com o email do convite
   - Verifique se o usuário é adicionado automaticamente

## Rollback (Se Necessário)

Se algo der errado, você pode reverter usando o backup:

```javascript
async function rollback(backupData) {
  const db = firebase.firestore();
  const batch = db.batch();
  
  // Restaurar teamMembers antigos
  backupData.forEach(member => {
    const ref = db.collection('teamMembers').doc(member.id);
    batch.set(ref, member);
  });
  
  await batch.commit();
  console.log('Rollback concluído');
}

// rollback(backupTeamMembers); // Use o backup salvo no Passo 1
```

## Configuração de Variáveis de Ambiente

Para funcionalidades avançadas (opcional):

```env
# .env.local
VITE_APP_BASE_URL=https://seu-dominio.com
VITE_FIREBASE_PROJECT_ID=seu-project-id

# Para Cloud Functions (se implementar)
SENDGRID_API_KEY=sua-chave-sendgrid
SENDER_EMAIL=noreply@seu-dominio.com
```

## Notas Importantes

1. **Plano Spark:** Todas as funcionalidades implementadas funcionam no plano gratuito
2. **Segurança:** Tokens nunca são salvos em texto puro no banco
3. **Compatibilidade:** Sistema mantém compatibilidade durante a migração
4. **Performance:** Queries otimizadas para minimizar leituras

## Próximos Passos

1. Execute a migração em ambiente de desenvolvimento primeiro
2. Teste todas as funcionalidades
3. Execute em produção durante horário de baixo tráfego
4. Monitore logs por 24-48 horas
5. Execute limpeza dos dados antigos após confirmação