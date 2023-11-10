const https = require('https');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const usuarioRoutes = require('./routes/usuarioRoutes');

const app = express();
const port = 443; // Porta padrão para HTTPS


// Carregue o certificado SSL (substitua 'cert.pem' e 'key.pem' com os seus caminhos)
const privateKey = fs.readFileSync('caminho-para-chave-privada.pem', 'utf8');
const certificate = fs.readFileSync('caminho-para-certificado.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };


app.use(bodyParser.json());

const apiConfig = {
  api_url: '',
  api_key: '',
  nomeInstancia: '',
  numeroWhatsApp: '',
  fotoWhatsApp: '',
};

app.post('/configurar-api', (req, res) => {
  const { api_url, api_key } = req.body;
  apiConfig.api_url = api_url;
  apiConfig.api_key = api_key;
  res.json({ message: 'API configurada com sucesso.' });
});

// Use as rotas do usuário
app.use('/usuario', usuarioRoutes);

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
  console.log(`API em execução em https://fast-api.azzybot.cloud`);
});
