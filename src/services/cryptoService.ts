/**
 * Serviço de criptografia para tokens seguros
 * Funciona no plano Spark - apenas Web Crypto API nativa
 */

class CryptoService {
  /**
   * Gera um token criptograficamente seguro
   */
  async generateSecureToken(): Promise<string> {
    const array = new Uint8Array(32); // 256 bits
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Gera hash SHA-256 de um token
   */
  async hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verifica se um token corresponde ao hash
   */
  async verifyToken(token: string, hash: string): Promise<boolean> {
    const tokenHash = await this.hashToken(token);
    return tokenHash === hash;
  }

  /**
   * Gera um ID único para convites
   */
  generateInviteId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
}

export const cryptoService = new CryptoService();