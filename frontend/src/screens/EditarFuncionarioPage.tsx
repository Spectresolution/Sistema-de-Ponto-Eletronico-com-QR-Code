import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import formatarCPF from "../utils/formatarCPF";
import "../styles/criarFuncionario.css";

type FuncionarioForm = {
  nome: string;
  cpf: string;
  matricula: string;
  email: string;
  senha?: string;
  cargo: string;
  departamento: string;
  jornada_padrao_horas: string;
  data_contratacao: string;
  is_admin: boolean;
  is_gestor: boolean;
};

export default function EditarFuncionarioPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState<FuncionarioForm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const res = await api.get(`/funcionarios/${id}`);
        const f = res.data.funcionario;

        setForm({
          nome: f.nome || "",
          cpf: f.cpf || "",
          matricula: f.matricula || "",
          email: f.email || "",
          senha: "",
          cargo: f.cargo || "",
          departamento: f.departamento || "",
          jornada_padrao_horas: String(f.jornada_padrao_horas || ""),
          data_contratacao: f.data_contratacao?.split("T")[0] || "",
          is_admin: !!f.is_admin,
          is_gestor: !!f.is_gestor,
        });
      } catch {
        alert("Erro ao carregar funcionário");
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [id]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    if (!form) return;

    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    let newValue: string | boolean = value;

    if (type === "checkbox") newValue = checked;
    if (name === "cpf") newValue = formatarCPF(value);

    setForm(prev => ({ ...prev!, [name]: newValue }));
  }

  async function salvar() {
    if (!form) return;

    const payload = { ...form };

    // Remove senha se estiver vazia (não atualizar senha sem querer)
    if (!payload.senha) delete payload.senha;

    try {
      await api.put(`/funcionarios/${id}`, payload);
      alert("Funcionário atualizado com sucesso!");
      navigate("/funcionarios");
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao atualizar");
    }
  }

  if (loading) return <p style={{ textAlign: "center" }}>Carregando...</p>;
  if (!form) return <p style={{ color: "red" }}>Erro ao carregar</p>;

  return (
    <div className="criar-container card">
      <h1>Editar Funcionário</h1>

      <input name="nome" value={form.nome} placeholder="Nome" onChange={handleChange} />
      <input name="cpf" value={form.cpf} placeholder="CPF" onChange={handleChange} />
      <input name="matricula" value={form.matricula} placeholder="Matrícula" onChange={handleChange} />
      <input name="email" value={form.email} placeholder="Email" onChange={handleChange} />
      <input name="senha" value={form.senha} placeholder="Nova senha (opcional)" onChange={handleChange} />
      <input name="cargo" value={form.cargo} placeholder="Cargo" onChange={handleChange} />
      <input name="departamento" value={form.departamento} placeholder="Departamento" onChange={handleChange} />
      <input name="jornada_padrao_horas" value={form.jornada_padrao_horas} placeholder="Jornada padrão" onChange={handleChange} />
      <input type="date" name="data_contratacao" value={form.data_contratacao} onChange={handleChange} />

      <div className="labels">
        <label>
          <input type="checkbox" name="is_admin" checked={form.is_admin} onChange={handleChange} />
          Administrador
        </label>
        <label>
          <input type="checkbox" name="is_gestor" checked={form.is_gestor} onChange={handleChange} />
          Gestor
        </label>
      </div>

      <button onClick={salvar}>Salvar Alterações</button>
    </div>
  );
}
