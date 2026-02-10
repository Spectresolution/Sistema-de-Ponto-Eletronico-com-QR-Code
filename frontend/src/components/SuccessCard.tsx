import { jsPDF } from "jspdf";

type Comprovante = {
  id: number;
  funcionario: string;
  tipo: string;
  data_hora: string;
  local: string;
};

export default function SuccessCard({ comprovante }: { comprovante: Comprovante }) {
  
  function salvarPDF() {
    const pdf = new jsPDF();

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("Ponto Registrado!", 20, 20);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);

    let y = 40;

    pdf.text(`Comprovante: #${comprovante.id}`, 20, y);
    y += 10;
    pdf.text(`Funcionário: ${comprovante.funcionario}`, 20, y);
    y += 10;
    pdf.text(`Tipo: ${comprovante.tipo}`, 20, y);
    y += 10;
    pdf.text(`Horário: ${comprovante.data_hora}`, 20, y);
    y += 10;
    pdf.text(`Local: ${comprovante.local}`, 20, y);

    pdf.save(`comprovante_${comprovante.id}.pdf`);
  }
  
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

      <button className="btn" onClick ={salvarPDF}>
        Salvar
      </button>
    </div>
  );
}
