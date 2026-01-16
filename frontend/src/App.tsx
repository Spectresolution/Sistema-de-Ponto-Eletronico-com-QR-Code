import { BrowserRouter, Routes, Route } from "react-router-dom";
import ConfirmPage from './screens/ConfirmPage';
import TerminalAdminPage from "./screens/TerminalAdminPage";


export default function App(){
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/confirmar" element={< ConfirmPage />} />
        <Route path="/terminal" element={< TerminalAdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}