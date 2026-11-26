const express = require('express');
const sequelize = require('./config/database');
const clienteRoutes = require('./routes/clienteRoutes');

const app = express();

app.use(express.json());

// Sincronizar modelos con la BD (sin recrear tablas)
sequelize.authenticate()
  .then(() => console.log('cliente-api: conexión a PostgreSQL establecida con Sequelize'))
  .catch((err) => console.error('cliente-api: error al conectar con PostgreSQL:', err.message));

// Ruta base para comprobación de estado
app.get('/', (req, res) => {
  res.status(200).json({ mensaje: 'cliente-api activa' });
});

// Registrar rutas
app.use('/clientes', clienteRoutes);

module.exports = app;
