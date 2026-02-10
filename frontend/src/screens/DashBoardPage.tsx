import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/dashboard.css";

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [erroPermissao, setErroPermissao] = useState("");

  const podeCadastrarFuncionario = user?.is_admin;

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  function acessarCadastroFuncionario() {
    if (!podeCadastrarFuncionario) {
      setErroPermissao("Função não permitida para seu perfil.");
      setTimeout(() => setErroPermissao(""), 3000);
      return;
    }

    navigate("/funcionarios/novo");
  }

  return (
    <div className="dashboard-body">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>📍 QR Ponto — Painel</h1>
          <p>
            Bem-vindo, <strong>{user?.nome}</strong>
          </p>
        </div>

        {erroPermissao && (
          <div className="erro-permissao">{erroPermissao}</div>
        )}

        <div className="dashboard-grid">
          <button
            className={`dashboard-card ${!podeCadastrarFuncionario? "disabled": ""}`}
            onClick={acessarCadastroFuncionario}
          >
            <div className="card-content">
              <div className="card-icon">👤</div>
              <h3>Cadastrar Funcionário</h3>
              <p>Novo colaborador no sistema</p>
            </div>

            {!podeCadastrarFuncionario && (
              <div className="card-overlay">✖</div>
            )}
          </button>

          <button
            className="dashboard-card"
            onClick={() => navigate("/funcionarios")}
          >
            📋
            <h3>Lista de Funcionários</h3>
            <p>Status: Folga, Trabalhando, Fora</p>
          </button>

          <button
            className="dashboard-card"
            onClick={() => navigate("/registros")}
          >
            🕒
            <h3>Editar Registros de Ponto</h3>
            <p>Ajustar entradas e saídas</p>
          </button>

          <button
            className="dashboard-card"
            onClick={() => navigate("/terminal")}
          >
            📷
            <h3>Abrir Terminal de Ponto</h3>
            <p>Gerar QR Code para registro</p>
          </button>
        </div>

        <button className="logout-btn" onClick={logout}>
          🚪 Sair
        </button>
      </div>
    </div>
  );
}
