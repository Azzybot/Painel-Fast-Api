const express = require('express');
const router = express.Router();
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose(); // Importar o pacote SQLite
const https = require('https'); // Importe o módulo HTTPS

// Conexão com o banco de dados SQLite
const db = new sqlite3.Database('bancoDeDados.db', (err) => {
  if (err) {
    console.error('Erro ao abrir o banco de dados', err.message);
  } else {
    console.log('Conexão ao banco de dados SQLite bem-sucedida');
  }
});

// Crie uma instância do Axios com a verificação de certificado SSL desativada
const axiosWithoutSslVerification = axios.create({
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
});

// Rota para obter dados do usuário conectado (Etapa 3)
router.get('/dados-usuario', (req, res) => {
  const { nomeInstancia, numeroWhatsApp, fotoWhatsApp } = apiConfig;
  res.json({
    nomeInstancia,
    numeroWhatsApp,
    fotoWhatsApp,
  });
});

// Rota para capturar dados do cliente (Etapa 4)
router.post('/capturar-dados-cliente', (req, res) => {
  const { fotoPerfil, nomeCliente, numeroCliente, diaAgendamento, horaAgendamento } = req.body;
  // Você pode processar e armazenar esses dados como necessário

  // Antes de processar os dados, verifique a disponibilidade e notifique o usuário
  verificarDisponibilidadeNoBancoDeDados(diaAgendamento, horaAgendamento, numeroCliente);
  res.json({ message: 'Dados do cliente capturados com sucesso.' });
});

// Rota para obter dados de contato (Etapa 5)
router.get('/dados-contato', (req, res) => {
  // Inicialmente, retornamos um array vazio
  const contatos = [];
  res.json({ contatos });
});

// Etapa 6: Verificar disponibilidade e notificar o usuário via webhook

// Função para verificar a disponibilidade de agendamento no banco de dados SQLite
async function verificarDisponibilidadeNoBancoDeDados(diaAgendamento, horaAgendamento, numeroCliente) {
  // Implemente a lógica real para consultar o banco de dados SQLite
  // Substitua as informações abaixo pela consulta SQL correta
  const consultaSQL = 'SELECT * FROM agendamentos WHERE diaAgendamento = ? AND horaAgendamento = ?';
  const valores = [diaAgendamento, horaAgendamento];

  db.get(consultaSQL, valores, (err, row) => {
    if (err) {
      console.error('Erro ao consultar o banco de dados:', err.message);
    } else {
      if (!row) {
        console.log('Agendamento está disponível');
        notificarUsuarioAgendamento(numeroCliente, true);
        // Agora, insira os dados do agendamento no banco de dados
        inserirAgendamentoNoBancoDeDados(diaAgendamento, horaAgendamento, numeroCliente);
      } else {
        console.log('Agendamento não está disponível');
        notificarUsuarioAgendamento(numeroCliente, false);
      }
    }
  });
}

// Função para inserir um novo agendamento no banco de dados
function inserirAgendamentoNoBancoDeDados(diaAgendamento, horaAgendamento, numeroCliente) {
  const insercaoSQL = 'INSERT INTO agendamentos (diaAgendamento, horaAgendamento, disponivel, numeroWhatsAppCliente) VALUES (?, ?, ?, ?)';
  const valoresInsercao = [diaAgendamento, horaAgendamento, false, numeroCliente];

  db.run(insercaoSQL, valoresInsercao, function(err) {
    if (err) {
      console.error('Erro ao inserir agendamento no banco de dados:', err.message);
    } else {
      console.log('Agendamento inserido com sucesso');
    }
  });
}

// Função para notificar o usuário sobre o agendamento via webhook
async function notificarUsuarioAgendamento(numeroWhatsAppCliente, disponivel) {
  // Informações para configuração do webhook
  const baseUrl = 'https://fast-api.azzybot.cloud'; // Substitua pela URL base da sua API
  const instancia = 'admin'; // Substitua pelo nome da instância
  const webhookUrl = `${baseUrl}/webhook/set/${instancia}`;

  // Carga útil para a solicitação
  const payload = {
    enabled: true,
    url: webhookUrl,
    webhookByEvents: false,
    events: ['SEND_MESSAGE'],
  };

  // Envie a requisição para configurar o webhook
  try {
    axiosWithoutSslVerification.post(webhookUrl, payload) // Use axiosWithoutSslVerification
      .then((response) => {
        console.log('Webhook configurado com sucesso:', response.data);
        // Agora que o webhook está configurado, envie a notificação ao usuário
        const mensagem = disponivel ? 'Agendamento disponível.' : 'Agendamento indisponível';
        const dadosNotificacao = {
          number: numeroWhatsAppCliente,
          message: mensagem,
        };

        // Envie a notificação via webhook
        axiosWithoutSslVerification.post(`${baseUrl}/messages/send`, dadosNotificacao) // Use axiosWithoutSslVerification
          .then((notificacaoResponse) => {
            console.log('Notificação enviada com sucesso:', notificacaoResponse.data);
          })
          .catch((error) => {
            console.error('Erro ao enviar notificação via webhook:', error);
          });
      })
      .catch((error) => {
        console.error('Erro ao configurar o webhook:', error);
      });
  } catch (error) {
    console.error('Erro ao configurar o webhook ou enviar notificação:', error);
  }
}

// Exemplo de uso da função
const numeroWhatsAppCliente = 'Número do Cliente'; // Substitua pelo número real
const disponivel = true; // Substitua pelo valor real (true para disponível, false para indisponível)

verificarDisponibilidadeNoBancoDeDados('Data do Agendamento', 'Hora do Agendamento', numeroWhatsAppCliente);

module.exports = router;
