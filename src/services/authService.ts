/**
 * Serviço de Autenticação para LegalX
 * 
 * Gerencia cadastro, login e autenticação de usuários
 * usando localStorage para persistência de dados.
 */

import { User, AuthState } from '../types/auth';

const AUTH_STORAGE_KEY = 'legalx_auth';
const USER_STORAGE_KEY = 'legalx_user';

class AuthService {
  
  /**
   * Registrar novo usuário
   */
  register(userData: Omit<User, 'id' | 'createdAt'>): { success: boolean; message: string; user?: User } {
    try {
      // Verificar se já existe usuário com este email
      const existingUser = this.getUserByEmail(userData.email);
      if (existingUser) {
        return {
          success: false,
          message: 'Já existe um usuário cadastrado com este e-mail.'
        };
      }

      // Criar novo usuário
      const newUser: User = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ...userData,
        createdAt: new Date().toISOString()
      };

      // Salvar usuário
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      
      console.log('Usuário registrado com sucesso:', newUser.officeName);
      
      return {
        success: true,
        message: 'Cadastro realizado com sucesso!',
        user: newUser
      };
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      return {
        success: false,
        message: 'Erro interno. Tente novamente.'
      };
    }
  }

  /**
   * Fazer login
   */
  login(email: string, password: string): { success: boolean; message: string; user?: User } {
    try {
      const user = this.getUserByEmail(email);
      
      if (!user) {
        return {
          success: false,
          message: 'E-mail não encontrado.'
        };
      }

      if (user.password !== password) {
        return {
          success: false,
          message: 'Senha incorreta.'
        };
      }

      // Salvar estado de autenticação
      const authState: AuthState = {
        isAuthenticated: true,
        user: user
      };
      
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
      
      console.log('Login realizado com sucesso:', user.officeName);
      
      return {
        success: true,
        message: 'Login realizado com sucesso!',
        user: user
      };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return {
        success: false,
        message: 'Erro interno. Tente novamente.'
      };
    }
  }

  /**
   * Fazer logout
   */
  logout(): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      console.log('Logout realizado com sucesso');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

  /**
   * Verificar se usuário está autenticado
   */
  isAuthenticated(): boolean {
    try {
      const authData = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!authData) return false;
      
      const authState: AuthState = JSON.parse(authData);
      return authState.isAuthenticated && authState.user !== null;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
  }

  /**
   * Obter usuário atual
   */
  getCurrentUser(): User | null {
    try {
      const authData = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!authData) return null;
      
      const authState: AuthState = JSON.parse(authData);
      return authState.user;
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      return null;
    }
  }

  /**
   * Buscar usuário por email
   */
  private getUserByEmail(email: string): User | null {
    try {
      const userData = localStorage.getItem(USER_STORAGE_KEY);
      if (!userData) return null;
      
      const user: User = JSON.parse(userData);
      return user.email === email ? user : null;
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      return null;
    }
  }

  /**
   * Validar formato de email
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validar senha
   */
  validatePassword(password: string): { isValid: boolean; message: string } {
    if (password.length < 6) {
      return {
        isValid: false,
        message: 'A senha deve ter pelo menos 6 caracteres.'
      };
    }
    
    return {
      isValid: true,
      message: ''
    };
  }

  /**
   * Validar OAB
   */
  validateOAB(oab: string): { isValid: boolean; message: string } {
    // Remove espaços e caracteres especiais
    const cleanOAB = oab.replace(/[^\w]/g, '');
    
    if (cleanOAB.length < 4) {
      return {
        isValid: false,
        message: 'Número da OAB deve ter pelo menos 4 caracteres.'
      };
    }
    
    return {
      isValid: true,
      message: ''
    };
  }
}

// Instância singleton
export const authService = new AuthService();
export default AuthService;