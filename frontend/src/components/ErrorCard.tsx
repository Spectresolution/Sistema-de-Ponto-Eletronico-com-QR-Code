type Props = {
  message: string;
};

export default function ErrorCard({ message }: Props) {
  return (
    <div className="card">
      <h3 style={{ color: '#f44336' }}>Erro</h3>
      <p>{message}</p>
      <button
        className="btn btn-danger"
        onClick={() => window.location.reload()}
      >
        Tentar novamente
      </button>
    </div>
  );
}
