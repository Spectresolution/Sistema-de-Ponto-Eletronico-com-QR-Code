import { useEffect, useState } from 'react';
import { api } from '../services/api';

type TerminalStatus = 'loading' | 'success' | 'error';

export default function TerminalPage() {
  const [status, setStatus] = useState<TerminalStatus>('loading');
  const [message, setMessage] = useState('Aguardando leitura do QR Code...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setMessage('QR Code inválido ou não informado.');
      setStatus('error');
      return;
    }

    registrarPonto(token);
  }, []);

  async function registrarPonto(token: string) {
    setStatus('loading');
    setMessage('Registrando ponto...');

    try {
      const res = await api.post('/ponto/registrar', { token });

      if (res.data.success) {
        setMessage('Ponto registrado com sucesso!');
        setStatus('success');
      } else {
        setMessage(res.data.error || 'Erro ao registrar ponto.');
        setStatus('error');
      }
    } catch {
      setMessage('Falha de comunicação com o servidor.');
      setStatus('error');
    }
  }

  return (
    <div className="container terminal">
      <h1>🖥️ Terminal de Ponto</h1>

      {status === 'loading' && (
        <div className="loading">
          <div className="loading-spinner" />
          <p>{message}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="card success">
          <h3>✅ Sucesso</h3>
          <p>{message}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="card error">
          <h3>❌ Erro</h3>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}
