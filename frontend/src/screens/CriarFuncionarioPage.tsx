import {useState} from 'react';
import {api} from '../services/api';
import '../styles/criarFuncionario.css';
import formatarCPF from '../utils/formatarCPF';
import { useNavigate } from 'react-router-dom';


export default function CriarFuncionarioPage(){
    const navigate = useNavigate();
    const [form, setForm] = useState({
        nome:'',
        cpf: '',
        matricula: '',
        email: '',
        senha: '',
        cargo: '',
        departamento: '',
        jornada_padrao_horas: '',
        data_contratacao: '',
        is_admin: false,
        is_gestor: false,
    });

    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    
    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
        ) {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
    
        let newValue: string | boolean = value;
    
        // Trata checkbox
        if (type === 'checkbox') {
          newValue = checked;
        }
    
        // Trata CPF com máscara
        if (name === 'cpf') {
          newValue = formatarCPF(value);
        }
    
        setForm(prev => ({
          ...prev,
          [name]: newValue
        }));
    }


    async function submit(){
        setErro('');
        setSucesso('');
        setLoading(true);

        try{
            const res = await api.post('/funcionarios', form);
            if( !res.data.success){
                setErro(res.data.error || "Erro ao criar funcionário!");
                return;
            }

            setSucesso("Funcionário criado com sucesso!");
            setForm({
                nome: '',
                cpf: '',
                matricula: '',
                email: '',
                senha: '',
                cargo: '',
                departamento: '',
                jornada_padrao_horas: '',
                data_contratacao: '',
                is_admin: false,
                is_gestor: false,
            });
           setTimeout(() => navigate("/funcionarios"), 3000);
        }catch(err:any){
            setErro(
                err.response?.data?.error|| 'Erro de comunicação com o servidor.'
            );
        } finally{
            setLoading(false);
        }
    }

    return(
        <div className="criar-container card">
            <h1>Cadastro de Funcionário</h1>
            {erro && <p style={{color: 'red'}}>{erro}</p>}
            {sucesso && <p style={{color: 'green'}}>{sucesso}</p>}
        
        <input
            name="nome"
            placeholder="Nome completo"
            value={form.nome}
            onChange={handleChange}
        />

        <input
            name="cpf"
            placeholder="CPF"
            value={form.cpf}
            onChange={handleChange}
        />

        <input
            name="matricula"
            placeholder="Número da matrícula"
            value={form.matricula}
            onChange={handleChange}
        />

        <input
            name="email"
            type="email"
            placeholder='email'
            value={form.email}
            onChange={handleChange}
        />
        <input
            name="senha"
            type="password"
            placeholder="Senha"
            value={form.senha}
            onChange={handleChange}
        />

        <input
            name="cargo"
            placeholder="Cargo ou Função"
            value={form.cargo}
            onChange={handleChange}
        />

        <input
            name="departamento"
            placeholder="Departamento"
            value={form.departamento}
            onChange={handleChange}
        />

        <input
            name="jornada_padrao_horas"
            placeholder="Jornada (em horas)"
            value={form.jornada_padrao_horas}
            onChange={handleChange}
        />

        <input
            name="data_contratacao"
            type="date"
            value={form.data_contratacao}
            onChange={handleChange}
        />
        <div className="labels">
            <div>
                <label>
                    <input
                        type="checkbox"
                        name="is_admin"
                        checked={form.is_admin}
                        onChange={handleChange}
                    />
                    Administrador
                </label>
            </div>
            <div>
                <label>
                    <input
                        type="checkbox"
                        name="is_gestor"
                        checked={form.is_gestor}
                        onChange={handleChange}
                    />
                    Gestor
                </label>
            </div>
        </div>
        <button onClick={submit} disabled={loading}>
            {loading ? 'Salvando...' : 'Criar Funcionário'}   
        </button>
        </div>
    );
}