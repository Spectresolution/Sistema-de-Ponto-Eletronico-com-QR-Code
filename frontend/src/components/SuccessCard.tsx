type Comprovante = {
  id: number;
  funcionario: string;
  tipo: string;
  data_hora: string;
  local: string;
};

export default function SuccessCard({ comprovante }: { comprovante: Comprovante }) {
  return (
    <div className="comprovante">
      <h2>Ponto Registrado!</h2>

      <p><strong>Comprovante:</strong> #{comprovante.id}</p>
      <p><strong>Funcionário:</strong> {comprovante.funcionario}</p>
      <p><strong>Tipo:</strong> {comprovante.tipo}</p>
      <p><strong>Horário:</strong> {comprovante.data_hora}</p>
      <p><strong>Local:</strong> {comprovante.local}</p>

      <button className="btn" onClick={() => window.close()}>
        Fechar
      </button>
    </div>
  );
}
