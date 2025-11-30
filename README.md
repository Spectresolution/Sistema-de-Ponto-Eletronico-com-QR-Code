# DESCRIÇÃO

Sistema de ponto eletrônico, utilizando QR-Code, para controle de entrada e saída de funcionários. Em andamento... 

# 🔐 API ENDPOINTS COMPLETOS
## 1. Autenticação & Segurança (/api/auth)
```javascript

POST    /api/auth/login              // Login funcionário
POST    /api/auth/login/admin        // Login admin
POST    /api/auth/refresh            // Refresh token
POST    /api/auth/logout             // Logout
POST    /api/auth/reset-password     // Solicitar reset de senha
```
## 2. Sistema de QR Code Dinâmico (/api/qrcode)
```javascript

GET     /api/qrcode/gerar            // Admin: Gera novo QR code (validade 2min)
POST    /api/qrcode/validar          // Valida QR code + registra ponto
GET     /api/qrcode/status           // Verifica status da sessão
```
## 3. Marcação de Ponto (/api/ponto)
```javascript

POST    /api/ponto/marcar            // Marcação via QR code
GET     /api/ponto/hoje              // Marcações do dia atual
GET     /api/ponto/historico         // Histórico com filtros
GET     /api/ponto/status-dia        // Status atual do dia (próxima ação)
```
## 4. Gestão de Funcionários (/api/funcionarios)
```javascript

GET     /api/funcionarios            // Listar (com paginação)
POST    /api/funcionarios            // Criar novo
GET     /api/funcionarios/:id        // Detalhes
PUT     /api/funcionarios/:id        // Atualizar
PUT     /api/funcionarios/:id/status // Ativar/Desativar
GET     /api/funcionarios/meu-time   // Para gestores: sua equipe
```
## 5. Gestão de Locais (/api/locais)
```javascript

GET     /api/locais                  // Listar todos
POST    /api/locais                  // Criar novo
PUT     /api/locais/:id              // Atualizar
DELETE  /api/locais/:id              // Excluir (soft delete)
GET     /api/locais/proximos         // Locais próximos às coordenadas
```

## 6. Sistema de Ajustes (/api/ajustes)
```javascript

POST    /api/ajustes/solicitar       // Funcionário solicita ajuste
GET     /api/ajustes/meus            // Minhas solicitações
GET     /api/ajustes/pendentes       // Admin: pendentes de aprovação
PUT     /api/ajustes/:id/aprovar     // Aprovar ajuste
PUT     /api/ajustes/:id/rejeitar    // Rejeitar ajuste
```

## 7. Relatórios & Analytics (/api/relatorios)
```javascript

GET     /api/relatorios/espelho      // Espelho de ponto
GET     /api/relatorios/horas        // Relatório de horas
GET     /api/relatorios/frequencia   // Relatório de frequência
GET     /api/relatorios/gestao       // Para gestores: sua equipe
POST    /api/relatorios/exportar     // Exportar em PDF/CSV
```

# 📱 FLUXO DE MARCACAO COM QR CODE
```text

1. ADMIN gera QR Code
   ↓
2. QR Code contém: session_token + local_id + timestamp
   ↓
3. FUNCIONÁRIO escaneia com app
   ↓
4. APP captura: GPS + Foto + session_token
   ↓
5. BACKEND valida:
   - QR Code não expirado (2min)
   - GPS dentro do raio
   - Horário permitido
   - Sequência lógica (Entrada → Intervalo → Saída)
   ↓
6. Registro salvo com todas as validações
```

# 🔒 VALIDAÇÕES DE SEGURANÇA

## 1. QR Code Dinâmico: Validade de 2 minutos, uso único
## 2. Validação GPS: Raio configurável por local

## 3. Horário Comercial: Restrição fora do horário de funcionamento
## 4. Sequência Lógica: Impede marcações inconsistentes
## 5. Foto Obrigatória: Evidência visual da marcação
## 6. JWT + Refresh Tokens: Autenticação robusta

# 🚀 IMPLEMENTAÇÃO RECOMENDADA

## Frontend Mobile (React Native):

- Câmera para QR Code
- GPS em tempo real
- Captura de foto
- Offline support para sincronização

## Backend (Node.js + Express):
```javascript

// Exemplo de endpoint de marcação
app.post('/api/ponto/marcar', authMiddleware, async (req, res) => {
    const {
        sessionToken,
        latitude,
        longitude, 
        fotoBase64,
        tipoRegistro
    } = req.body;

    // Validações sequenciais
    const validacoes = [
        validarQRCode(sessionToken),
        validarLocalizacao(latitude, longitude),
        validarHorario(tipoRegistro),
        validarSequencia(req.user.id, tipoRegistro),
        processarFoto(fotoBase64)
    ];

    // ... implementação
});
```

## Admin Dashboard (React + TypeScript):

- Gestão de usuários
- Geração de QR Codes
- Relatórios em tempo real
- Aprovação de ajustes

# Implementação

## 1. Estrutura do Projeto

```text

ponto-eletronico/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── config/
│   │   ├── utils/
│   │   └── app.js
│   ├── package.json
│   └── .env
├── mobile/
└── admin-web/
```

