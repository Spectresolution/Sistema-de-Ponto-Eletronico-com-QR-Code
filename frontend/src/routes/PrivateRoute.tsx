import { Navigate } from 'react-router-dom';

type Props = {
  children: React.ReactNode;
  roles?: ('admin' | 'gestor')[];
};

export default function PrivateRoute({ children, roles }: Props) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!user) return <Navigate to="/login" replace />;

  // Se a rota exige papéis específicos
  if (roles && roles.length > 0) {
    const autorizado = roles.some(role =>
      role === 'admin' ? user.is_admin : user.is_gestor || user.is_admin
    );

    if (!autorizado) return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
