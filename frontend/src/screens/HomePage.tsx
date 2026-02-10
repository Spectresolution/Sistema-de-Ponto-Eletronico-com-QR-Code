import { useNavigate } from "react-router-dom";
import "../styles/home.css";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-body">
      <div className="home-container">
        <div className="home-header">
          <h1 className="home-logo">📍 QR Ponto</h1>
          <p className="home-subtitle">
            Sistema de Registro de Ponto Eletrônico com QR Code
          </p>
        </div>

        <div className="home-buttons">
          <button
            className="home-btn primary"
            onClick={() => navigate("/login")}
          >
            🔐 Fazer Login
          </button>

          <button
            className="home-btn secondary"
            onClick={() => navigate("/terminal")}
          >
            📷 Ponto Eletrônico (QR Code)
          </button>
        </div>

        <div className="home-footer">
          <p>
            Utilize o login para acessar sua área administrativa ou escaneie o
            QR Code no terminal para registrar seu ponto.
          </p>
        </div>
      </div>
    </div>
  );
}
