const express = require('express');
const sequelize = require('./config/database');
const compraRoutes = require('./routes/compraRoutes');

const app = express();

app.use(express.json());

// Verificar conexión a PostgreSQL al iniciar
sequelize.authenticate()
  .then(() => console.log('compra-api: conexión a PostgreSQL establecida con Sequelize'))
  .catch((err) => console.error('compra-api: error al conectar con PostgreSQL:', err.message));

// Ruta base para comprobación de estado
app.get('/', (req, res) => {
  res.status(200).json({ mensaje: 'compra-api activa' });
});

// Registrar rutas
app.use('/compras', compraRoutes);

module.exports = app;
