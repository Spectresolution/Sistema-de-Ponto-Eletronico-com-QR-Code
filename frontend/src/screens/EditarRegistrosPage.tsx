import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import "../styles/listaFuncionarios.css";

type Registro = {
  id: number;
  timestamp_registro: string;
  tipo_registro: string; // mantido simples para não quebrar backend antigo
};

export default function EditarRegistrosPage() {
  const { id } = useParams();

  const [registros, setRegistros] = useState<Registro[]>([]);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [novoHorario, setNovoHorario] = useState("");
  const [novoTipo, setNovoTipo] = useState("entrada");

  // NOVO REGISTRO
  const [novoRegistroDataHora, setNovoRegistroDataHora] = useState("");
  const [novoRegistroTipo, setNovoRegistroTipo] = useState("entrada");

  useEffect(() => {
    carregarRegistros();
  }, [id]);

  async function carregarRegistros() {
    const res = await api.get(`/ponto/historico?funcionario_id=${id}`);
    const lista = Object.values(res.data.historico).flat() as Registro[];
    setRegistros(lista);
  }

  function iniciarEdicao(registro: Registro) {
    setEditandoId(registro.id);
    setNovoTipo(registro.tipo_registro);

    const data = new Date(registro.timestamp_registro);
    const isoLocal = new Date(data.getTime() - data.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setNovoHorario(isoLocal);
  }

  async function salvarEdicao(registroId: number) {
    try {
      await api.put(`/ponto/registro/${registroId}`, {
        novo_timestamp: new Date(novoHorario).toISOString(),
        novo_tipo: novoTipo
      });

      setEditandoId(null);
      carregarRegistros();
    } catch {
      alert("Erro ao atualizar registro");
    }
  }

  async function excluirRegistro(registroId: number) {
    if (!window.confirm("Deseja realmente excluir este registro?")) return;
    await api.delete(`/ponto/registro/${registroId}`);
    carregarRegistros();
  }

  async function adicionarRegistro() {
    if (!novoRegistroDataHora) {
      alert("Informe data e hora");
      return;
    }

    try {
      await api.post(`/ponto/registro/manual`, {
        funcionario_id: id,
        timestamp: new Date(novoRegistroDataHora).toISOString(),
        tipo: novoRegistroTipo
      });

      setNovoRegistroDataHora("");
      setNovoRegistroTipo("entrada");
      carregarRegistros();
    } catch {
      alert("Erro ao adicionar registro");
    }
  }

  return (
    <div className="lista-container">
      <div className="lista-card">
        <h1>Registros de Ponto</h1>

        {/* ➕ NOVO REGISTRO */}
        <div className="novo-registro-box">
          <h3>Adicionar Registro Manual</h3>
          <input
            type="datetime-local"
            value={novoRegistroDataHora}
            onChange={e => setNovoRegistroDataHora(e.target.value)}
          />
          <select
            value={novoRegistroTipo}
            onChange={e => setNovoRegistroTipo(e.target.value)}
          >
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
          <button onClick={adicionarRegistro}>➕ Adicionar</button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Hora</th>
              <th>Tipo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {registros.map(r => {
              const data = new Date(r.timestamp_registro);
              return (
                <tr key={r.id}>
                  <td>{data.toLocaleDateString()}</td>

                  <td>
                    {editandoId === r.id ? (
                      <input
                        type="datetime-local"
                        value={novoHorario}
                        onChange={e => setNovoHorario(e.target.value)}
                      />
                    ) : (
                      data.toLocaleTimeString()
                    )}
                  </td>

                  <td>
                    {editandoId === r.id ? (
                      <select
                        value={novoTipo}
                        onChange={e => setNovoTipo(e.target.value)}
                      >
                        <option value="entrada">Entrada</option>
                        <option value="saida">Saída</option>
                      </select>
                    ) : (
                      r.tipo_registro
                    )}
                  </td>

                  <td>
                    {editandoId === r.id ? (
                      <>
                        <button onClick={() => salvarEdicao(r.id)}>💾 Salvar</button>
                        <button onClick={() => setEditandoId(null)}>❌ Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => iniciarEdicao(r)}>✏ Editar</button>
                        <button onClick={() => excluirRegistro(r.id)}>🗑 Excluir</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
