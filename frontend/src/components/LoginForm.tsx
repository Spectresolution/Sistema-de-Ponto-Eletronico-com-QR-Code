type Props = {
    email: string;
    senha: string;
    error?: string;
    onEmailChange: (v: string) => void;
    onSenhaChange: (v: string) => void;
    onSubmit: () => void;
}

export default function LoginForm({
    email,
    senha,
    error,
    onEmailChange,
    onSenhaChange,
    onSubmit,
}: Props){
    return(
        <>
            <div className="card">
                <h3>Faça seu Login</h3>
                <p>Digite suas credenciais para registrar o ponto</p>
            </div>

            <div className="form-group">
                <label>E-mail</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                />
            </div>
            
            <div className="form-group">
                <label>Senha</label>
                <input 
                  type="password"
                  value={senha}
                  onChange={(e) => onSenhaChange(e.target.value)}
                />
            </div>

            <button className='btn' onClick={onSubmit}> Entrar </button>

            {error && <div className="error">{error}</div> }
        </>
    );
}