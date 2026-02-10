import { useEffect, useState } from 'react';
import LoginForm from '../components/LoginForm';
import ConfirmCard from '../components/ConfirmCard';
import SuccessCard from '../components/SuccessCard';
import Loading from '../components/Loading';
import ErrorCard from '../components/ErrorCard';
import '../styles/confirmar.css';
import { api } from '../services/api';

type Usuario = {
  nome: string;
  email: string;
};

type PontoData = {
  tipo: string;
  local: string;
  horario: string;
  data: string;
};

type Comprovante = {
  id: number;
  funcionario: string;
  tipo: string;
  data_hora: string;
  local: string;
};

type Tela =
  | 'login'
  | 'confirm'
  | 'success'
  | 'loading'
  | 'error';

export default function ConfirmPage() {
  const [tela, setTela] = useState<Tela>('loading');

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loginError, setLoginError] = useState('');

  const [qrToken, setQrToken] = useState<string | null>(null);
  const [webToken, setWebToken] = useState<string | null>(
    localStorage.getItem('ponto_web_token')
  );

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [pontoData, setPontoData] = useState<PontoData>({
    tipo: 'entrada',
    local: 'Carregando...',
    horario: new Date().toLocaleTimeString('pt-BR'),
    data: new Date().toLocaleDateString('pt-BR'),
  });

  const [comprovante, setComprovante] = useState<Comprovante | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Processando...');
  const [errorMessage, setErrorMessage] = useState('');

  /* ==============================
     INIT
  ============================== */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setErrorMessage('QR Code inválido ou expirado.');
      setTela('error');
      return;
    }

    setQrToken(token);

    if (webToken) {
      verificarSessao(token);
    } else {
      setTela('login');
    }
  }, []);

  /* ==============================
     API
  ============================== */
  async function verificarSessao(token: string) {
    try {
      setTela('loading');
      setLoadingMessage('Verificando sessão...');

      const { data } = await api.post('/ponto/verificar-sessao', {
        web_token: webToken,
      });

      if (data.valid) {
        setUsuario(data.user);
        await carregarDadosPonto(token);
        setTela('confirm');
      } else {
        localStorage.removeItem('ponto_web_token');
        setTela('login');
      }
    } catch {
      setTela('login');
    }
  }

  async function carregarDadosPonto(token: string) {
    const verificar = await api.post('/qrcode/verificar', {
      session_token: token,
    });

    if (!verificar.data.available) {
      setErrorMessage('QR Code inválido ou já utilizado.');
      setTela('error');
      return;
    }

    const info = await api.get(`/qrcode/info?token=${token}`);

    setPontoData((prev) => ({
      ...prev,
      local: info.data.data.local_nome,
      tipo: info.data.data.tipo || 'entrada',
    }));
  }

  async function login() {
    try {
      setTela('loading');
      setLoadingMessage('Validando credenciais...');

      const { data } = await api.post('/ponto/login-web', {
        email,
        senha,
      });

      if (!data.success) {
        setLoginError(data.error || 'Erro ao fazer login');
        setTela('login');
        return;
      }

      localStorage.setItem('ponto_web_token', data.web_token);
      setWebToken(data.web_token);
      setUsuario(data.user);

      if (qrToken) {
        await carregarDadosPonto(qrToken);
      }

      setTela('confirm');
    } catch {
      setLoginError('Erro de conexão com o servidor');
      setTela('login');
    }
  }

  async function confirmarPonto() {
    if (!qrToken || !webToken) return;

    try {
      setTela('loading');
      setLoadingMessage('Registrando ponto...');

      const { data } = await api.post('/ponto/registrar-web', {
        session_token: qrToken,
        web_token: webToken,
      });

      if (!data.success) {
        alert(data.error);
        setTela('confirm');
        return;
      }

      setComprovante(data.comprovante);
      setTela('success');
    } catch {
      setErrorMessage('Erro ao confirmar ponto. Se persistir, gere um novo QR code e tente novamente.');
      setTela('error');
    }
  }

  /* ==============================
     RENDER
  ============================== */
  return (
    <div className="confirm-body">
      <div className="confirm-container">
        <div className="logo">
          <h1>📍 Sistema de Ponto</h1>
          <p>Confirmação de Registro</p>
        </div>

         {tela === 'login' && (
          <LoginForm
            email={email}
            senha={senha}
            error={loginError}
            onEmailChange={setEmail}
            onSenhaChange={setSenha}
            onSubmit={login}
          />
        )}

        {tela === 'confirm' && usuario && (
          <ConfirmCard
            tipo={pontoData.tipo}
            local={pontoData.local}
            horario={pontoData.horario}
            data={pontoData.data}
            funcionario={usuario.nome}
            onConfirm={confirmarPonto}
            onCancel={() => window.close()}
          />
        )}

        {tela === 'success' && comprovante && (
          <SuccessCard comprovante={comprovante} />
        )}

        {tela === 'loading' && <Loading message={loadingMessage} />}

        {tela === 'error' && <ErrorCard message={errorMessage} />}

      </div>
    </div>
  );
}
