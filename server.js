const express = require('express');
require('dotenv').config();

const colaboradoresRoutes = require('./routes/colaboradores.routes');

const app = express();
app.use(express.json());

// Rotas
app.use('/colaboradores', colaboradoresRoutes);

// Healthcheck
app.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'API de Gestão de Colaboradores e Benefícios',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

