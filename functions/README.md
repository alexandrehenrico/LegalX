# Cloud Functions para LegalX

## Visão Geral

Este diretório contém Cloud Functions para funcionalidades avançadas do LegalX que requerem execução server-side.

## ⚠️ Requisitos do Plano Firebase

**IMPORTANTE:** As Cloud Functions requerem o **plano Blaze (pago)** do Firebase.

### Funcionalidades por Plano:

**Plano Spark (Gratuito):**
- ✅ Sistema de convites com links seguros
- ✅ Validação de tokens no frontend
- ✅ Envio manual via `mailto:`
- ✅ Todas as funcionalidades principais

**Plano Blaze (Pago):**
- ✅ Todas as funcionalidades do Spark
- ✅ Envio automático de emails
- ✅ Validação server-side adicional
- ✅ Logs centralizados

## Configuração (Apenas para Plano Blaze)

### 1. Instalar Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 2. Configurar Variáveis de Ambiente

```bash
# SendGrid (para envio de emails)
firebase functions:config:set sendgrid.api_key="SUA_CHAVE_SENDGRID"
firebase functions:config:set sendgrid.sender_email="noreply@seudominio.com"

# URL base da aplicação
firebase functions:config:set app.base_url="https://seudominio.com"
```

### 3. Deploy das Functions

```bash
cd functions
npm install
npm run deploy
```

## Funções Disponíveis

### `sendInviteEmail`

Envia email automático com link de convite.

**Uso:**
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const sendInviteEmail = httpsCallable(functions, 'sendInviteEmail');

try {
  const result = await sendInviteEmail({ inviteId: 'abc123' });
  console.log('Email enviado:', result.data);
} catch (error) {
  console.error('Erro:', error);
}
```

### `validateInviteToken`

Validação server-side de tokens de convite.

**Uso:**
```javascript
const validateInviteToken = httpsCallable(functions, 'validateInviteToken');

const result = await validateInviteToken({ 
  inviteId: 'abc123', 
  token: 'token-plain' 
});

if (result.data.valid) {
  console.log('Token válido:', result.data.invitation);
} else {
  console.log('Token inválido:', result.data.reason);
}
```

### `acceptInviteSecure`

Aceitação de convite com validação server-side completa.

**Uso:**
```javascript
const acceptInviteSecure = httpsCallable(functions, 'acceptInviteSecure');

const result = await acceptInviteSecure({ 
  inviteId: 'abc123', 
  token: 'token-plain' 
});

console.log('Resultado:', result.data);
```

## Fallback para Plano Spark

Se você está no plano Spark, o sistema funciona completamente sem as Cloud Functions:

1. **Envio de Email:** Use o botão "Enviar por Email" que abre o cliente de email padrão
2. **Validação:** Feita no frontend com Web Crypto API
3. **Aceitação:** Processada diretamente no Firestore com regras de segurança

## Monitoramento

### Logs das Functions

```bash
firebase functions:log
```

### Métricas no Console Firebase

1. Acesse o Console Firebase
2. Vá em "Functions"
3. Monitore execuções, erros e performance

## Custos Estimados (Plano Blaze)

- **Invocações:** $0.40 por milhão
- **Tempo de CPU:** $0.0000025 por 100ms
- **Rede:** $0.12 por GB

**Estimativa para escritório médio:**
- 100 convites/mês = ~$0.01
- Custo mensal total: < $1.00

## Troubleshooting

### Erro: "Function not found"
```bash
firebase deploy --only functions
```

### Erro: "SendGrid API key not configured"
```bash
firebase functions:config:set sendgrid.api_key="SUA_CHAVE"
firebase deploy --only functions
```

### Erro: "CORS"
As functions já incluem headers CORS apropriados.

## Desenvolvimento Local

```bash
cd functions
npm run serve
```

Isso inicia o emulador local das functions em `http://localhost:5001`.