const express = require('express');
const sequelize = require('./config/database');
const productoRoutes = require('./routes/productoRoutes');

const app = express();

app.use(express.json());

// Verificar conexión a PostgreSQL al iniciar
sequelize.authenticate()
  .then(() => console.log('producto-api: conexión a PostgreSQL establecida con Sequelize'))
  .catch((err) => console.error('producto-api: error al conectar con PostgreSQL:', err.message));

// Ruta base para comprobación de estado
app.get('/', (req, res) => {
  res.status(200).json({ mensaje: 'producto-api activa' });
});

// Registrar rutas
app.use('/productos', productoRoutes);

module.exports = app;
