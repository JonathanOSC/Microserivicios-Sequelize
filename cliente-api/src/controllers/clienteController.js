const Cliente = require('../models/cliente');

const clienteController = {
  // GET /clientes
  async obtenerClientes(req, res) {
    try {
      const clientes = await Cliente.findAll({
        attributes: [['id_clientes', 'id'], 'nombre', 'email'],
        order: [['id_clientes', 'ASC']],
      });
      res.status(200).json(clientes);
    } catch (error) {
      res.status(500).json({ mensaje: 'No se pudieron obtener los clientes' });
    }
  },

  // GET /clientes/:id
  async obtenerClientePorId(req, res) {
    const id = Number(req.params.id);

    try {
      const cliente = await Cliente.findByPk(id, {
        attributes: [['id_clientes', 'id'], 'nombre', 'email'],
      });

      if (!cliente) {
        return res.status(404).json({ mensaje: 'Cliente no encontrado' });
      }

      res.status(200).json(cliente);
    } catch (error) {
      res.status(500).json({ mensaje: 'No se pudo obtener el cliente' });
    }
  },

  // POST /clientes
  async crearCliente(req, res) {
    const { id_clientes, nombre, email } = req.body;

    if (!nombre || !email) {
      return res
        .status(400)
        .json({ mensaje: "Los campos 'nombre' y 'email' son obligatorios" });
    }

    try {
      const datos = { nombre, email };
      if (id_clientes !== undefined && id_clientes !== null) {
        datos.id_clientes = id_clientes;
      }

      const nuevoCliente = await Cliente.create(datos);

      res.status(201).json({
        id: nuevoCliente.id_clientes,
        nombre: nuevoCliente.nombre,
        email: nuevoCliente.email,
      });
    } catch (error) {
      res.status(500).json({
        mensaje: 'No se pudo crear el cliente' + (error.message ? `: ${error.message}` : ''),
      });
    }
  },

  // PUT /clientes/:id
  async actualizarCliente(req, res) {
    const id = Number(req.params.id);
    const { nombre, email } = req.body;

    if (!Number.isInteger(id) || !nombre || !email) {
      return res.status(400).json({
        mensaje: "El id, 'nombre' y 'email' son obligatorios",
      });
    }

    try {
      const [filas] = await Cliente.update(
        { nombre, email },
        { where: { id_clientes: id } }
      );

      if (filas === 0) {
        return res.status(404).json({ mensaje: 'Cliente no encontrado' });
      }

      const clienteActualizado = await Cliente.findByPk(id, {
        attributes: [['id_clientes', 'id'], 'nombre', 'email'],
      });

      res.status(200).json(clienteActualizado);
    } catch (error) {
      res.status(500).json({
        mensaje: 'No se pudo actualizar el cliente' + (error.message ? `: ${error.message}` : ''),
      });
    }
  },

  // DELETE /clientes/:id
  async eliminarCliente(req, res) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ mensaje: 'El id del cliente no es válido' });
    }

    try {
      const cliente = await Cliente.findByPk(id); //MODIFICAR ESTA LINEA

      if (!cliente) {
        return res.status(404).json({ mensaje: 'Cliente no encontrado' });
      }

      console.log('Cliente a eliminar:', cliente.toJSON());

      await cliente.destroy();

      res.status(200).json({ mensaje: 'Cliente eliminado', cliente });
    } catch (error) {
      // Error de clave foránea en PostgreSQL
      if (error.parent && error.parent.code === '23503') {
        return res.status(409).json({
          mensaje: 'No se puede eliminar el cliente porque tiene compras asociadas',
        });
      }

      res.status(500).json({ mensaje: 'No se pudo eliminar el cliente' });
    }
  },
};

module.exports = clienteController;
