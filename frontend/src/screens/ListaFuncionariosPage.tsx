import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "../styles/listaFuncionarios.css";

type StatusHoje = "TRABALHANDO" | "FORA_DO_TURNO" | "FOLGA";

type Funcionario = {
  id: number;
  nome: string;
  cargo: string;
  email: string;
  status_hoje: StatusHoje;
};

export default function ListaFuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🔐 Normaliza usuário
  const rawUser = JSON.parse(localStorage.getItem("user") || "null");
  const user = rawUser && {
    ...rawUser,
    is_admin: !!rawUser.is_admin,
    is_gestor: !!rawUser.is_gestor
  };

  useEffect(() => {
    carregarFuncionarios();
  }, []);

  async function carregarFuncionarios() {
    try {
      const { data } = await api.get("/funcionarios?statusHoje=true");
      setFuncionarios(data.funcionarios);
    } catch {
      alert("Erro ao carregar funcionários");
    } finally {
      setLoading(false);
    }
  }

  async function desativarFuncionario(id: number) {
    if (!window.confirm("Deseja realmente desativar este funcionário?")) return;

    await api.patch(`/funcionarios/${id}/status`, { ativo: false });
    carregarFuncionarios();
  }

  function getStatusLabel(status: StatusHoje) {
    switch (status) {
      case "TRABALHANDO":
        return "Trabalhando";
      case "FORA_DO_TURNO":
        return "Fora do Turno";
      case "FOLGA":
        return "Folga";
    }
  }

  function getStatusClass(status: StatusHoje) {
    switch (status) {
      case "TRABALHANDO":
        return "status-trabalhando";
      case "FORA_DO_TURNO":
        return "status-fora";
      case "FOLGA":
        return "status-folga";
    }
  }

  if (loading) return <p className="loading">Carregando funcionários...</p>;

  return (
    <div className="lista-container">
      <div className="lista-card">
        <h1>Funcionários</h1>

        {user?.is_admin && (
          <button
            onClick={() => navigate("/funcionarios/novo")}
            className="btn-novo"
          >
            ➕ Novo Funcionário
          </button>
        )}

        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cargo</th>
              <th>Email</th>
              <th>Status Hoje</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {funcionarios.map(f => (
              <tr key={f.id}>
                <td>{f.nome}</td>
                <td>{f.cargo}</td>
                <td>{f.email}</td>

                <td>
                  <span className={`status-badge ${getStatusClass(f.status_hoje)}`}>
                    {getStatusLabel(f.status_hoje)}
                  </span>
                </td>

                <td className="acoes">
                  <button
                    className="btn-registros"
                    onClick={() => navigate(`/registros/${f.id}`)}
                  >
                    Registros
                  </button>

                  {user?.is_admin && (
                    <>
                      <button
                        className="btn-editar"
                        onClick={() => navigate(`/funcionarios/${f.id}`)}
                      >
                        Editar
                      </button>

                      <button
                        className="btn-desativar"
                        onClick={() => desativarFuncionario(f.id)}
                      >
                        Desativar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
