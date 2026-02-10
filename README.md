#  📍 Sistema de Ponto Eletrônico com QR Code

Sistema completo de controle de ponto eletrônico utilizando QR Code para registro de entrada e saída de funcionários. Backend funcional com API REST completa e interfaces web para terminal coletivo e confirmação.

## 🚀 Funcionalidades Principais

### ✅ **Implementadas e Testadas**
- **Autenticação JWT** com níveis de permissão (admin/gestor/funcionário)
- **Gestão completa de funcionários** (CRUD com hierarquia)
- **Gestão de locais de trabalho** com geolocalização
- **Sistema de QR Code** com expiração e uso único
- **Terminal coletivo** para geração de QR Codes públicos
- **Página web de confirmação** com login e registro
- **Registro de dispositivos autorizados** para segurança
- **Histórico completo** de pontos por funcionário
- **Validação de localização** (dentro do raio permitido)
- **Interface administrativa** completa via API

## 🔐  API ENDPOINTS IMPLEMENTADOS
### 1. Autenticação & Segurança (/api/auth)
```javascript

POST    /api/auth/login              // Login funcionário/admin - Retorna token JWT válido por 24h
```
### 2. Sistema de QR Code Dinâmico (/api/qrcode)
```javascript

POST /api/qrcode/gerar // Admin: Gera QR Code (5 minutos)
POST /api/qrcode/gerar-publico // Terminal: Gera QR Code público (5 minutos)
POST /api/qrcode/validar // Valida QR Code (apenas verificação)
POST /api/qrcode/verificar // Verifica disponibilidade do QR Code
GET /api/qrcode/info // Obtém informações do QR Code
GET /api/qrcode/limpar-tokens // Debug: Status de tokens
```
### 3. Gestão de Funcionários (/api/funcionarios)
```javascript

GET /api/funcionarios // Listar todos funcionários (admin)
POST /api/funcionarios // Criar novo funcionário (admin)
GET /api/funcionarios/:id // Buscar funcionário por ID
PUT /api/funcionarios/:id // Atualizar funcionário
POST /api/funcionarios/:id/toggle // Ativar/desativar funcionário
```
### 4. Gestão de Locais (/api/locais)
```javascript

GET /api/locais // Listar todos locais ativos
POST /api/locais // Criar novo local (admin)
```

### 5. **Registro de Ponto** (`/api/ponto`)

```javascript
POST /api/ponto/marcar // App: Registra ponto com JWT
POST /api/ponto/login-web // Web: Login para página de confirmação
POST /api/ponto/registrar-web // Web: Registra ponto via página
POST /api/ponto/verificar-sessao // Web: Verifica sessão ativa
GET /api/ponto/hoje // Lista pontos do dia atual
GET /api/ponto/historico // Histórico por mês/ano
GET /api/ponto/todos // Admin: Todos registros

```

## Para implementações futuras

### 6. Gestão de Locais (/api/locais)
```javascript

PUT     /api/locais/:id              // Atualizar
DELETE  /api/locais/:id              // Excluir (soft delete)
GET     /api/locais/proximos         // Locais próximos às coordenadas
```

### 7. Sistema de Ajustes (/api/ajustes)
```javascript

POST    /api/ajustes/solicitar       // Funcionário solicita ajuste
GET     /api/ajustes/meus            // Minhas solicitações
GET     /api/ajustes/pendentes       // Admin: pendentes de aprovação
PUT     /api/ajustes/:id/aprovar     // Aprovar ajuste
PUT     /api/ajustes/:id/rejeitar    // Rejeitar ajuste
```

### 8. Relatórios & Analytics (/api/relatorios)
```javascript

GET     /api/relatorios/espelho      // Espelho de ponto
GET     /api/relatorios/horas        // Relatório de horas
GET     /api/relatorios/frequencia   // Relatório de frequência
GET     /api/relatorios/gestao       // Para gestores: sua equipe
POST    /api/relatorios/exportar     // Exportar em PDF/CSV
```

## 📱 FLUXO DE MARCACAO COM QR CODE

### **Terminal Coletivo** (Tablet/Computador)
1. Acessa `http://<ip da máquina>:3000/terminal`
2. Clique em "Gerar QR Code"
3. QR Code é gerado com validade de 5 minutos

### **Funcionário** (Celular)
1. Escaneia QR Code com câmera
2. Abre página `http://<ip da máquina>:3000/confirmar?<token>`
3. **Primeira vez**: Faz login com e-mail e senha
4. **Próximas vezes**: Reconhece dispositivo automaticamente
5. Confirma registro (entrada/saída automático)
6. Recebe comprovante digital

### **Servidor** (Backend)
1. Valida QR Code (não expirado, não utilizado)
2. Identifica funcionário pela sessão web
3. Determina tipo automático (entrada/saída)
4. Registra ponto no banco de dados
5. Marca QR Code como utilizado


# 🔒 MEDIDAS DE SEGURANÇA
## 1. Autenticação

- Tokens JWT com expiração de 24 horas
- Senhas armazenadas com bcrypt (hash)
- Middleware de autenticação em todas rotas protegidas

## 2. QR Code Seguro

- Tokens aleatórios de 32 caracteres alfanuméricos
- Validade limitada (2-5 minutos)
- Uso único por token
- Verificação de expiração em milissegundos

## 3. Controle de Acesso

- Hierarquia: Admin → Gestor → Funcionário
- Permissões granularizadas por endpoint
- Validação de status (ativo/inativo)

## 4. Validação de Localização

- Verificação de coordenadas GPS
- Raio de tolerância configurável por local
- Prevenção de "ponto amigo"


# 🗄️ **ESTRUTURA DO BANCO DE DADOS**

```text

funcionario                # Dados dos funcionários
local_trabalho             # Locais de trabalho com coordenadas
qrcode_session             # Sessões de QR Code com expiração
registro_ponto             # Registros de ponto
sessao_web                 # Sessões web para página de confirmação
dispositivo_autorizacao    # Dispositivos autorizados por funcionário
solicitacao_ajuste         # Solicitações de ajuste (implementação futura)
```


# Estrutura do Projeto

```text

## 🏗️ **ESTRUTURA DO PROJETO**

ponto-eletronico/
├── backend/
│ ├── src/
│ │ ├── controllers/
│ │ │ ├── authController.js # Autenticação
│ │ │ ├── funcionarioController.js # Gestão de funcionários
│ │ │ ├── localController.js # Gestão de locais
│ │ │ ├── qrcodeController.js # QR Code (público e admin)
│ │ │ └── pontoController.js # Registro e consultas
│ │ ├── routes/
│ │ │ ├── authRoutes.js
│ │ │ ├── funcionarioRoutes.js
│ │ │ ├── localRoutes.js
│ │ │ ├── qrcodeRoutes.js
│ │ │ ├── pontoRoutes.js
│ │ │ └── mainRoutes.js
│ │ ├── middleware/
│ │ │ └── auth.js # Middleware JWT
│ │ ├── config/
│ │ │ ├── database.js # Config SQLite
│ │ │ ├── setupDatabase.js # Criação de tabelas
│ │ │ └── seed.js # Dados iniciais
│ │ ├── utils/
│ │ │ └── helpers.js # Hash, JWT, QR Code, validação
│ │ └── app.js # Aplicação principal
│ ├── public/
│ │ ├── terminal.html # Terminal coletivo
│ │ └── confirmar.html # Página de confirmação
│ ├── testes/
│ │ ├── teste-completo.js # Teste fluxo completo
│ │ ├── teste-fluxo-web.js # Teste fluxo web
│ │ └── debug-token.js # Debug tokens
│ ├── package.json
│ └── .env (deixei um arquivo .txt como exemplo para o dotenv é importante fazer um para que o frontend funcione adequadamente)

```

# 🚀 COMO EXECUTAR

## Pré-requisitos

- Node.js 16+
- npm ou yarn

## Instalação
```bash
cd backend
npm install
```
## Configuração
```bash
cp .env.example .env
# Edite .env com suas configurações
```

## Inicialização do Banco
```bash
# Criação das tabelas e dados iniciais
npm run reset-database
# Ou apenas seed
node src/config/seed.js
```

## Execução
```bash
# Modo desenvolvimento
npm run dev

# Modo produção
npm start
```

## 🐋 Acessando a imagem do docker

```bash
docker pull pauloandersonlima/sistema-ponto-eletronico:dev
```
OBS.: Para rodar um container a partir do repositório:

```bash
docker run -it -p 3000:3000 pauloandersonlima/
sistema-ponto-eletronico:dev
```

## 📡 Acessando o backend via IP da máquina

Se você estiver usando Docker ou rodando o backend localmente em outra máquina da rede, siga estas instruções para acessar a API:

### 1️⃣ Descobrir o IP da máquina

* **Linux / macOS**:

```bash
# Mostra o IP da interface de rede ativa
ip addr show
# ou
ifconfig
```

Procure o endereço **inet** da interface conectada à rede local (ex: `192.168.0.15`).

* **Windows**:

```powershell
ipconfig
```

Procure o endereço IPv4 da sua conexão ativa (ex: `192.168.0.15`).

> ⚠️ Não use `127.0.0.1` ou `localhost` se estiver acessando de outro dispositivo, pois eles apontam para o próprio dispositivo.

---

### 2️⃣ Testar a API no navegador ou Postman

Se a máquina com o backend estiver rodando na porta **3000**, acesse:

```
http://<IP_DA_MAQUINA>:3000/health
```

Exemplo:

```
http://192.168.0.15:3000/health
```

Você deverá ver algo como:

```json
{
  "status": "OK",
  "timestamp": "2026-01-09T12:00:00.000Z",
  "environment": "development"
}
```

Para acessar os endpoints da API:

```
http://<IP_DA_MAQUINA>:3000/api/...
```

---

### 3️⃣ Observações importantes

* Certifique-se de que o firewall da máquina permite conexões na porta **3000**.
* Se estiver usando Docker, a porta já deve estar mapeada via `-p 3000:3000` no `docker run` ou `docker-compose.yml`.
* Qualquer outro dev que receber o código ou Docker poderá usar o mesmo procedimento para acessar a API da rede local.

---


## 🧪 TESTES

### Teste do Fluxo Completo
```bash
node testes/teste-completo.js
```

### Teste do Fluxo Web
```bash
node testes/teste-fluxo-web.js
```

### Credenciais de Teste
```text
Admin: admin@email.com / admin123
Funcionário: carlos.silva@email.com / senha123
```

# 📊 ESTADO ATUAL

## ✅ Completamente Funcional

- Backend API REST completa
- Sistema de autenticação JWT
- Gestão de funcionários e locais (Backend)
- Geração e validação de QR Codes
- Terminal coletivo (React.ts)
- Página web de confirmação (React.ts)
- Registro de ponto com validação
- Download do comprovante de registro em PDF
- Histórico e consultas (Backend)
- Sistema de sessões web 
- Container Docker :dev
- Conexão de aparelho externo

# 🛠️ TECNOLOGIAS UTILIZADAS
## Backend

- Node.js - Ambiente de execução
- Express - Framework web
- SQLite - Banco de dados
- JWT - Autenticação
- bcrypt - Hash de senhas
- QRCode - Geração de QR Codes

## Frontend (Páginas Web)

- HTML5/CSS3 - Estrutura e estilo
- JavaScript (ES6+) - Lógica cliente
- React.ts - Framework para as páginas

## Ferramentas

- Nodemon - Reinício automático em dev
- dotenv - Gerenciamento de variáveis
- crypto - Geração de tokens seguros
- jsPDF - Salva dados dos registros em PDF

## Docker

- Imagem disponível em acesso (acima)

# 📈 PRÓXIMAS ETAPAS

## Curto Prazo
- Consertar a edição de registro de ponto (não está sendo registrado quando o funcionário entra/sai)
- Sistema de notificações
- Integração com biometria/RFID
- Registro de dispositivos autorizados
- Relatórios básicos em PDF
- Exportação de dados (CSV/Excel)
- Sistema de notificações por e-mail

## Médio Prazo

- App mobile nativo (React Native)
- Integração com biometria
- Sistema de turnos e escalas
- Controle de horas extras

## Longo Prazo

- Relatórios avançados (PDF/Excel)
- Machine Learning para detectar padrões
- Integração com sistemas de RH
- Versão multi-empresa
- API pública para integrações

# 🤝 CONTRIBUIÇÃO

- Fork o repositório
- Crie uma branch (git checkout -b feature/nova-funcionalidade)
- Commit suas mudanças (git commit -am 'Adiciona nova funcionalidade')
- Push para a branch (git push origin feature/nova-funcionalidade)
- Crie um Pull Request

# 📄 LICENÇA

Este projeto está licenciado sob a MIT License 

# 📞 SUPORTE

Para suporte, abra uma issue no GitHub ou entre em contato com a equipe de desenvolvimento.

**Desenvolvido com ❤️ para modernizar o controle de ponto eletrônico** 

# 🥹 Me Patrocine 

Visite meu [sponsors](https://github.com/sponsors/Pucapuka) e me dá uma forcinha
ou via pix solucoes.magic.ti@gmail.com

Última atualização: 7 de Dezembro 2025