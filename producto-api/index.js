require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`producto-api escuchando en el puerto ${PORT}`);
});
