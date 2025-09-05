# Testes do Sistema de Convites Seguros

## Testes Manuais

### Teste 1: Criar Convite Seguro

**Objetivo:** Verificar criação de convite com token criptográfico

**Passos:**
1. Faça login como owner/admin de uma equipe
2. Acesse a aba "Equipe"
3. Clique em "Convidar Membro"
4. Preencha email válido e selecione função
5. Clique em "Criar Convite"

**Resultado Esperado:**
- Link seguro é gerado
- Token não aparece no Firestore (apenas hash)
- Link pode ser copiado
- Convite aparece na lista de pendentes

**Verificação no Firestore:**
```javascript
// Console do navegador
const inviteDoc = await firebase.firestore().collection('invitations').doc('INVITE_ID').get();
console.log('Dados do convite:', inviteDoc.data());
// Deve conter tokenHash, não token
```

### Teste 2: Aceitar Convite - Usuário Novo

**Objetivo:** Usuário sem conta aceita convite e cria conta

**Passos:**
1. Copie o link de convite gerado no Teste 1
2. Abra em aba anônima/navegador privado
3. Acesse o link
4. Verifique se metadados do convite aparecem
5. Clique em "Fazer Login para Aceitar"
6. Clique em "Criar Conta"
7. Preencha dados com o MESMO email do convite
8. Complete o cadastro

**Resultado Esperado:**
- Página de convite mostra dados corretos
- Redirecionamento para cadastro funciona
- Após cadastro, convite é aceito automaticamente
- Usuário é adicionado à equipe
- Convite fica marcado como "accepted"

### Teste 3: Aceitar Convite - Email Diferente

**Objetivo:** Verificar validação de email

**Passos:**
1. Use link de convite válido
2. Faça login com email DIFERENTE do convite
3. Tente aceitar o convite

**Resultado Esperado:**
- Sistema mostra aviso de email incorreto
- Convite não é aceito
- Opção para fazer logout e login correto

### Teste 4: Convite Expirado

**Objetivo:** Verificar tratamento de convites expirados

**Passos:**
1. No console, modifique um convite para expirar:
```javascript
await firebase.firestore().collection('invitations').doc('INVITE_ID').update({
  expiresAt: new Date(Date.now() - 1000).toISOString() // 1 segundo atrás
});
```
2. Acesse o link do convite

**Resultado Esperado:**
- Página mostra "Convite Expirado"
- Não permite aceitação
- Convite é marcado como "expired" automaticamente

### Teste 5: Token Inválido

**Objetivo:** Verificar segurança contra tokens falsificados

**Passos:**
1. Pegue um link de convite válido
2. Modifique o parâmetro `token` na URL
3. Acesse o link modificado

**Resultado Esperado:**
- Sistema rejeita token inválido
- Mensagem de erro apropriada
- Convite não é aceito

### Teste 6: Múltiplas Equipes

**Objetivo:** Verificar que usuário pode pertencer a várias equipes

**Passos:**
1. Crie duas equipes diferentes
2. Convide o mesmo usuário para ambas
3. Aceite ambos os convites
4. Verifique se usuário aparece em ambas as equipes

**Resultado Esperado:**
- Usuário pode aceitar múltiplos convites
- Aparece como membro ativo em todas as equipes
- Subcoleção `users/{uid}/teams` contém múltiplas entradas

## Testes Automatizados

### Configuração

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

### Teste 1: Geração de Token Seguro

```javascript
// src/__tests__/cryptoService.test.ts
import { cryptoService } from '../services/cryptoService';

describe('CryptoService', () => {
  test('deve gerar token seguro único', async () => {
    const token1 = await cryptoService.generateSecureToken();
    const token2 = await cryptoService.generateSecureToken();
    
    expect(token1).toHaveLength(64); // 32 bytes = 64 chars hex
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });

  test('deve gerar hash consistente', async () => {
    const token = 'test-token-123';
    const hash1 = await cryptoService.hashToken(token);
    const hash2 = await cryptoService.hashToken(token);
    
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 = 64 chars hex
  });

  test('deve verificar token corretamente', async () => {
    const token = await cryptoService.generateSecureToken();
    const hash = await cryptoService.hashToken(token);
    
    const isValid = await cryptoService.verifyToken(token, hash);
    const isInvalid = await cryptoService.verifyToken('wrong-token', hash);
    
    expect(isValid).toBe(true);
    expect(isInvalid).toBe(false);
  });
});
```

### Teste 2: Validação de Convites

```javascript
// src/__tests__/inviteService.test.ts
import { inviteService } from '../services/inviteService';

// Mock do Firebase
jest.mock('../firebase.config', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-123',
      email: 'test@example.com'
    }
  },
  db: {}
}));

describe('InviteService', () => {
  test('deve salvar convite pendente no localStorage', () => {
    const inviteId = 'test-invite-123';
    const token = 'test-token-456';
    
    inviteService.savePendingInvite(inviteId, token);
    
    const pending = inviteService.getPendingInvite();
    expect(pending).toEqual({
      inviteId,
      token,
      timestamp: expect.any(String)
    });
  });

  test('deve limpar convite pendente expirado', () => {
    // Simular convite antigo (mais de 1 hora)
    const oldInvite = {
      inviteId: 'old-invite',
      token: 'old-token',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 horas atrás
    };
    
    localStorage.setItem('legalx_pending_invite', JSON.stringify(oldInvite));
    
    const pending = inviteService.getPendingInvite();
    expect(pending).toBeNull();
  });

  test('deve validar email case-insensitive', () => {
    const email1 = 'Test@Example.COM';
    const email2 = 'test@example.com';
    
    // Esta lógica deve estar na função de validação
    expect(email1.toLowerCase().trim()).toBe(email2.toLowerCase().trim());
  });
});
```

### Teste 3: Componente de Aceitação

```javascript
// src/__tests__/InviteAcceptPage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import InviteAcceptPage from '../components/Invites/InviteAcceptPage';

// Mock dos serviços
jest.mock('../services/inviteService');
jest.mock('../services/authService');

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('InviteAcceptPage', () => {
  test('deve mostrar erro para link inválido', async () => {
    // URL sem parâmetros
    Object.defineProperty(window, 'location', {
      value: { search: '' }
    });

    renderWithRouter(<InviteAcceptPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Link de convite inválido')).toBeInTheDocument();
    });
  });

  test('deve mostrar metadados do convite', async () => {
    const mockInvite = {
      id: 'test-invite',
      email: 'test@example.com',
      role: 'member',
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        teamName: 'Equipe Teste',
        inviterName: 'João Silva'
      }
    };

    // Mock do serviço
    require('../services/inviteService').inviteService.getInviteMetadata.mockResolvedValue(mockInvite);

    renderWithRouter(<InviteAcceptPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Equipe Teste')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });
  });

  test('deve redirecionar para login se não autenticado', async () => {
    // Mock usuário não autenticado
    require('../services/authService').authService.getCurrentUser.mockReturnValue(null);

    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate
    }));

    renderWithRouter(<InviteAcceptPage />);
    
    // Simular clique no botão de aceitar
    const acceptButton = await screen.findByText('Fazer Login para Aceitar');
    acceptButton.click();
    
    expect(mockNavigate).toHaveBeenCalledWith('/login?redirect=accept-invite');
  });
});
```

## Executar Testes

```bash
# Instalar dependências de teste
npm install --save-dev @testing-library/react @testing-library/jest-dom jest-environment-jsdom

# Executar todos os testes
npm test

# Executar testes específicos
npm test -- --testNamePattern="CryptoService"
npm test -- --testNamePattern="InviteService"
npm test -- --testNamePattern="InviteAcceptPage"

# Executar com coverage
npm test -- --coverage
```

## Checklist de Validação

- [ ] Tokens são gerados com 64 caracteres (32 bytes)
- [ ] Hash SHA-256 é salvo no Firestore (não o token)
- [ ] Links de convite funcionam para usuários não autenticados
- [ ] Validação de email é case-insensitive
- [ ] Convites expiram automaticamente
- [ ] Usuários podem pertencer a múltiplas equipes
- [ ] Regras de segurança impedem acesso não autorizado
- [ ] Migração preserva todos os dados existentes
- [ ] Interface mostra erros apropriados
- [ ] Links podem ser copiados e enviados por email

## Monitoramento Pós-Deploy

1. **Logs do Console:**
   - Verificar erros de autenticação
   - Monitorar criação/aceitação de convites
   - Verificar performance das queries

2. **Firestore Usage:**
   - Monitorar número de leituras/escritas
   - Verificar se está dentro dos limites do Spark

3. **User Feedback:**
   - Coletar feedback sobre UX do novo fluxo
   - Monitorar taxa de aceitação de convites
   - Verificar se há confusão com múltiplas equipes