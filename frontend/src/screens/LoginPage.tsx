import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
//import '../styles/login.css'; // opcional

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, senha });

      if (!data.success) {
        setErro(data.error || 'Erro ao fazer login');
        return;
      }

      // 🔐 Salva autenticação
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // 📌 Redireciona conforme perfil
      if (data.user.is_admin || data.user.is_gestor) {
        navigate('/dashboard');
      } else {
        navigate('/funcionario');
      }

    } catch (err: any) {
      setErro(
        err.response?.data?.error || 'Erro de comunicação com o servidor'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Sistema de Ponto</h1>
        <p>Faça login para continuar</p>

        {erro && <div className="erro">{erro}</div>}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
