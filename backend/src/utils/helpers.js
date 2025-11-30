const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { getDistance } = require('geolib');

// Hash de senha
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Verificar senha
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Gerar JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, is_admin: user.is_admin },
    process.env.JWT_SECRET || 'secret_key',
    { expiresIn: '8h' }
  );
};

// Validar localização
const validarLocalizacao = (lat1, lon1, lat2, lon2, raioMaximo) => {
  const distance = getDistance(
    { latitude: lat1, longitude: lon1 },
    { latitude: lat2, longitude: lon2 }
  );
  return distance <= raioMaximo;
};

// Gerar QR Code
const gerarQRCode = async (data) => {
  try {
    return await QRCode.toDataURL(JSON.stringify(data));
  } catch (error) {
    throw new Error('Erro ao gerar QR Code');
  }
};

// Calcular horas trabalhadas
const calcularHorasTrabalhadas = (registros) => {
  let totalMinutos = 0;
  let entrada = null;
  
  for (const registro of registros) {
    switch (registro.tipo_registro) {
      case 'ENTRADA':
        entrada = new Date(registro.timestamp_registro);
        break;
      case 'INICIO_INTERVALO':
        if (entrada) {
          totalMinutos += (new Date(registro.timestamp_registro) - entrada) / 60000;
          entrada = null;
        }
        break;
      case 'FIM_INTERVALO':
        entrada = new Date(registro.timestamp_registro);
        break;
      case 'SAIDA':
        if (entrada) {
          totalMinutos += (new Date(registro.timestamp_registro) - entrada) / 60000;
          entrada = null;
        }
        break;
    }
  }
  
  const horas = Math.floor(totalMinutos / 60);
  const minutos = Math.floor(totalMinutos % 60);
  
  return { horas, minutos, totalMinutos };
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  validarLocalizacao,
  gerarQRCode,
  calcularHorasTrabalhadas
};