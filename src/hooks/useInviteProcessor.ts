/**
 * Hook para processar convites pendentes após login/signup
 */

import { useEffect, useState } from 'react';
import { inviteService } from '../services/inviteService';
import { authService } from '../services/authService';

export function useInviteProcessor() {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      if (user && !processing) {
        await processInviteIfPending();
      }
    });

    return unsubscribe;
  }, [processing]);

  const processInviteIfPending = async () => {
    try {
      setProcessing(true);
      const result = await inviteService.processPendingInvite();
      
      if (result) {
        setResult(result);
        
        // Mostrar notificação por 5 segundos
        setTimeout(() => {
          setResult(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Erro ao processar convite pendente:', error);
    } finally {
      setProcessing(false);
    }
  };

  return {
    processing,
    result,
    clearResult: () => setResult(null)
  };
}