import React, { useState, useEffect, useRef } from "react";
import '../styles/terminal.css';
import { api } from "../services/api";

interface QRCodeData {
  qr_code: string;
  confirm_url: string;
  local: string;
  expires_at: string;
  valid_for: string;
}

export default function TerminalAdminPage() {
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState<string>("--:--");
  const intervalRef = useRef<number | null>(null);

  const LOCAL_TRABALHO_ID = 1; // ajuste para o local correto
  const API_URL = "/api";

  useEffect(() => {
    // limpar timer ao desmontar componente
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const gerarQRCode = async () => {
  setLoading(true);
  setError(null);
  setQrData(null);
  setTimer("--:--");

  try {
    const res = await api.post(
      "/qrcode/gerar-publico",
      { local_trabalho_id: LOCAL_TRABALHO_ID },
      {
        headers: {
          "X-Forwarded-Host": window.location.host,
          "X-Forwarded-Proto": window.location.protocol.replace(":", ""),
        },
      }
    );

    if (!res.data.success) {
      setError(res.data.message || "Falha ao gerar QR Code.");
      return;
    }

    setQrData(res.data.data);
    iniciarContador(5 * 60);
  } catch (err) {
    console.error(err);
    setError("Erro de comunicação com o servidor.");
  } finally {
    setLoading(false);
  }
};


  const iniciarContador = (seconds: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    let remaining = seconds;
    setTimer(formatTime(remaining));

    intervalRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining >= 0) {
        setTimer(formatTime(remaining));
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTimer("Expirado");
      }
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="terminal-body">
      <div className="container">
        <div className="header">
          <h1 className="logo">📍 QR-Ponto</h1>
          <p className="subtitle">Sistema de Registro de Ponto Eletrônico</p>
        </div>

        <button
          className="btn-gerar"
          onClick={gerarQRCode}
          disabled={loading}
        >
          {loading ? "⏳ Gerando QR Code..." : "🔄 Gerar Novo QR Code"}
        </button>

        {qrData && (
          <>
            <div className="timer">{`⏰ QR Code válido por: ${timer}`}</div>

            <div className="qrcode-container">
              <img
                src={qrData.qr_code}
                alt="QR Code do ponto"
                className="qrcode-image"
              />
              <div className="qrcode-info">
                <p>
                  Local: <strong>{qrData.local}</strong>
                </p>
                <p>
                  Expira em: <strong>{qrData.expires_at}</strong> (
                  {qrData.valid_for})
                </p>
                <p>
                  URL de confirmação:{" "}
                  <a href={qrData.confirm_url} target="_blank">
                    {qrData.confirm_url}
                  </a>
                </p>
              </div>
            </div>
          </>
        )}

        {error && <p className="error">{error}</p>}

        <div className="info-box">
          <h3>📋 Instruções para Uso:</h3>
          <ol>
            <li>
              <strong>Clique em "Gerar Novo QR Code"</strong> para criar um
              código válido
            </li>
            <li>
              <strong>Funcionário escaneia</strong> o QR Code com a câmera do
              celular
            </li>
            <li>
              <strong>Será aberta uma página</strong> para confirmação do
              ponto
            </li>
            <li>
              <strong>Na primeira vez</strong>, o funcionário faz login com
              e-mail e senha
            </li>
            <li>
              <strong>Confirme o registro</strong> de entrada ou saída
            </li>
            <li>
              <strong>Receba o comprovante</strong> do ponto registrado
            </li>
          </ol>
          <p style={{ marginTop: "15px", fontStyle: "italic" }}>
            ⚠️ Cada QR Code é válido por apenas <strong>5 minutos</strong> e
            pode ser usado <strong>uma única vez</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
