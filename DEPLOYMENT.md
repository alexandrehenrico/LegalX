# Guia de Deploy - Sistema de Convites Seguros

## Resumo das Mudanças

Este sistema implementa convites seguros com tokens criptográficos, suporte a múltiplas equipes e melhorias de segurança, **funcionando completamente no plano Spark (gratuito)** do Firebase.

## Funcionalidades Implementadas

### ✅ Plano Spark (Gratuito)
- **Tokens Seguros:** SHA-256 com Web Crypto API nativa
- **Links de Convite:** URLs com tokens únicos e expiração
- **Múltiplas Equipes:** Usuário pode pertencer a várias equipes
- **Validação Rigorosa:** Email, token e expiração
- **Envio Manual:** Botão para abrir cliente de email
- **Regras Firestore:** Segurança robusta sem Cloud Functions

### 🔄 Plano Blaze (Opcional)
- **Envio Automático:** Cloud Functions para email via SendGrid
- **Validação Server-side:** Funções adicionais de segurança
- **Logs Centralizados:** Monitoramento avançado

## Deploy no Plano Spark

### 1. Atualizar Regras Firestore

```bash
# Fazer backup das regras atuais
firebase firestore:rules > firestore.rules.backup

# Deploy das novas regras
firebase deploy --only firestore:rules
```

### 2. Verificar Configuração

```javascript
// Console do Firebase - verificar se as coleções estão acessíveis
const testRead = await firebase.firestore().collection('teams').limit(1).get();
console.log('Acesso às equipes:', !testRead.empty || testRead.empty);
```

### 3. Executar Migração

Siga os passos detalhados em `MIGRATION.md`:

1. Fazer backup dos dados atuais
2. Executar script de migração
3. Verificar integridade dos dados
4. Limpar dados antigos (após confirmação)

## Deploy no Plano Blaze (Opcional)

### 1. Configurar SendGrid

```bash
# Criar conta no SendGrid (gratuito até 100 emails/dia)
# Obter API Key em: https://app.sendgrid.com/settings/api_keys

# Configurar no Firebase
firebase functions:config:set sendgrid.api_key="SUA_CHAVE_SENDGRID"
firebase functions:config:set sendgrid.sender_email="noreply@seudominio.com"
firebase functions:config:set app.base_url="https://seudominio.com"
```

### 2. Deploy das Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

### 3. Atualizar Frontend para Usar Functions

```javascript
// src/services/inviteService.ts - adicionar método opcional
async createInvitationWithEmail(teamId: string, email: string, role: string) {
  const link = await this.createInvitation(teamId, email, role);
  
  // Se Cloud Functions estão disponíveis, enviar email automaticamente
  if (typeof window !== 'undefined' && window.firebase?.functions) {
    try {
      const sendEmail = httpsCallable(getFunctions(), 'sendInviteEmail');
      await sendEmail({ inviteId: link.inviteId });
      return { ...link, emailSent: true };
    } catch (error) {
      console.warn('Envio automático falhou, use envio manual:', error);
      return { ...link, emailSent: false };
    }
  }
  
  return { ...link, emailSent: false };
}
```

## Verificação Pós-Deploy

### 1. Testes Funcionais

Execute os testes manuais descritos em `TESTS.md`:

- [ ] Criar convite seguro
- [ ] Aceitar convite (usuário novo)
- [ ] Aceitar convite (usuário existente)
- [ ] Validação de email incorreto
- [ ] Convite expirado
- [ ] Token inválido
- [ ] Múltiplas equipes

### 2. Verificar Segurança

```javascript
// Console do navegador - verificar se tokens não vazam
const invites = await firebase.firestore().collection('invitations').get();
invites.docs.forEach(doc => {
  const data = doc.data();
  console.log('Convite:', doc.id, {
    hasTokenHash: !!data.tokenHash,
    hasPlainToken: !!data.token, // Deve ser false
    email: data.email
  });
});
```

### 3. Monitorar Performance

```javascript
// Verificar uso de leituras Firestore
console.log('Quota usage:', await firebase.firestore().app.options);
```

## Custos Estimados

### Plano Spark (Gratuito)
- **Firestore:** 50k leituras/dia, 20k escritas/dia
- **Auth:** Ilimitado
- **Hosting:** 10GB/mês
- **Custo:** $0/mês

### Plano Blaze (Pago)
- **Functions:** $0.40/milhão invocações
- **SendGrid:** Gratuito até 100 emails/dia
- **Custo estimado:** < $5/mês para escritório médio

## Rollback

Se necessário, reverter para sistema anterior:

```bash
# 1. Restaurar regras antigas
cp firestore.rules.backup firestore.rules
firebase deploy --only firestore:rules

# 2. Executar script de rollback (ver MIGRATION.md)

# 3. Reverter código
git revert HEAD
```

## Suporte

### Problemas Comuns

1. **"Permission denied" ao criar convite:**
   - Verificar se usuário é admin/owner da equipe
   - Verificar se regras Firestore foram aplicadas

2. **Link de convite não funciona:**
   - Verificar se URL base está correta
   - Verificar se token não foi modificado

3. **Email não é enviado (Blaze):**
   - Verificar configuração SendGrid
   - Verificar logs das Cloud Functions

### Logs Úteis

```javascript
// Habilitar logs detalhados
localStorage.setItem('debug', 'legalx:*');

// Verificar estado do convite
console.log('Pending invite:', inviteService.getPendingInvite());
```

## Próximas Melhorias

1. **Notificações Push:** Para convites aceitos
2. **Bulk Invites:** Convidar múltiplos emails
3. **Templates de Email:** Personalização avançada
4. **Analytics:** Métricas de aceitação de convites
5. **Integração Slack/Teams:** Notificações externas