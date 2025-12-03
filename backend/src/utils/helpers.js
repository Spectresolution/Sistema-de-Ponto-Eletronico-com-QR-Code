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
  try {
    const distance = getDistance(
      { latitude: lat1, longitude: lon1 },
      { latitude: lat2, longitude: lon2 }
    );
    return distance <= raioMaximo;
  } catch (error) {
    return false;
  }
};

// Gerar QR Code
const gerarQRCode = async (data) => {
  try {
    // Verificar se data já é string
    let qrData;
    
    if (typeof data === 'string') {
      // Se for string, verificar se já é JSON válido
      try {
        JSON.parse(data); // Testar se é JSON válido
        qrData = data; // Já é JSON string, usar diretamente
      } catch {
        qrData = data; // Não é JSON, usar como string normal
      }
    } else {
      // Se for objeto, converter para JSON
      qrData = JSON.stringify(data);
    }
    
    console.log('📱 Gerando QR Code:');
    console.log('   Tipo:', typeof data);
    console.log('   Conteúdo:', qrData.length > 100 ? qrData.substring(0, 100) + '...' : qrData);
    
    const qrCode = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H', // Alta correção de erro
      width: 300,
      margin: 1
    });
    
    console.log('   QR Code gerado:', qrCode.substring(0, 50) + '...');
    return qrCode;
  } catch (error) {
    console.error('❌ Erro ao gerar QR Code:', error);
    throw new Error('Erro ao gerar QR Code: ' + error.message);
  }
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  validarLocalizacao,
  gerarQRCode
};