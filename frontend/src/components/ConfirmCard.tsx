type Props={
    tipo: string;
    local: string;
    horario: string;
    data: string;
    funcionario: string;
    onConfirm: () => void;
    onCancel: () => void;
};


export default function ConfirmCard ({
    tipo,
    local,
    horario,
    data,
    funcionario,
    onConfirm,
    onCancel,
}: Props){

    return(
        <>
        
            <div className="card">
                <h3>✅ Confirmar registro de ponto?</h3>
                <p><strong>Local: </strong> {local}</p>
                <p><strong>Horário: </strong> {horario}</p>
                <p><strong>Data: </strong> {data}</p>
                <p><strong>Funcionário</strong> {funcionario}</p>
                <p><strong>Cargo: </strong></p>
            </div>

            <button className="btn btn-success" onClick={onConfirm}>
                Confirmar
            </button>

            <button className="btn btn-secondary" style={{ marginTop: 10 }} onClick={onCancel}>
                Cancelar
            </button>
        </>
    );
}