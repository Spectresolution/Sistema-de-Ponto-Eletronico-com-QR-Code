import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from './screens/HomePage';
import LoginPage from "./screens/LoginPage"
import TerminalPage from './screens/TerminalPage';
import ConfirmPage from './screens/ConfirmPage';
import DashboardPage from "./screens/DashBoardPage";
import CriarFuncionarioPage from "./screens/CriarFuncionarioPage";
import EditarFuncionarioPage from "./screens/EditarFuncionarioPage";

import PrivateRoute from "./routes/PrivateRoute";
import ListaFuncionariosPage from "./screens/ListaFuncionariosPage";
import EditarRegistrosPage from "./screens/EditarRegistrosPage";

export default function App(){
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/terminal" element={< TerminalPage />} />
        <Route path="/confirmar" element={< ConfirmPage />} />
        
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute roles={['admin', 'gestor']}>
              <DashboardPage/>
            </PrivateRoute>
          }
        />

        {/*Lista de Funcionários*/}
        <Route
          path="/funcionarios"
          element={
            <PrivateRoute roles={['admin', 'gestor']}>
              <ListaFuncionariosPage/>
            </PrivateRoute>
          }
        />

        {/* Criar Funcionário — SOMENTE ADMIN */}
        <Route
          path="/funcionarios/novo"
          element={
            <PrivateRoute roles={['admin']}>
              <CriarFuncionarioPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/funcionarios/:id"
          element={
            <PrivateRoute roles={['admin']}>
              <EditarFuncionarioPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/registros/:id"
          element={
            <PrivateRoute roles={['admin', 'gestor']}>
              <EditarRegistrosPage/>
            </PrivateRoute>
          }
        
        />


      </Routes>
    </BrowserRouter>
  );
}