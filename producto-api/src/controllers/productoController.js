const Producto = require('../models/producto');

const productoController = {
  // GET /productos
  async obtenerProductos(req, res) {
    try {
      const productos = await Producto.findAll({
        attributes: [['id_productos', 'id'], 'id_productos', 'nombre', 'precio', 'stock'],
        order: [['id_productos', 'ASC']],
      });
      res.status(200).json(productos);
    } catch (error) {
      res.status(500).json({
        mensaje: 'No se pudieron obtener los productos' + (error.message ? `: ${error.message}` : ''),
      });
    }
  },

  // GET /productos/:id
  async obtenerProductoPorId(req, res) {
    const id = Number(req.params.id);

    try {
      const producto = await Producto.findByPk(id, {
        attributes: [['id_productos', 'id'], 'id_productos', 'nombre', 'precio', 'stock'],
      });

      if (!producto) {
        return res.status(404).json({ mensaje: 'Producto no encontrado' });
      }

      res.status(200).json(producto);
    } catch (error) {
      res.status(500).json({ mensaje: 'No se pudo obtener el producto' });
    }
  },

  // POST /productos
  async crearProducto(req, res) {
    const { id_productos, nombre, precio, stock } = req.body;

    if (!nombre || precio === undefined || stock === undefined) {
      return res.status(400).json({
        mensaje: "Los campos 'nombre', 'precio' y 'stock' son obligatorios",
      });
    }

    try {
      const datos = { nombre, precio, stock };
      if (id_productos !== undefined && id_productos !== null) {
        datos.id_productos = id_productos;
      }

      const nuevoProducto = await Producto.create(datos);

      res.status(201).json({
        id: nuevoProducto.id_productos,
        id_productos: nuevoProducto.id_productos,
        nombre: nuevoProducto.nombre,
        precio: nuevoProducto.precio,
        stock: nuevoProducto.stock,
      });
    } catch (error) {
      res.status(500).json({
        mensaje: 'No se pudo crear el producto' + (error.message ? `: ${error.message}` : ''),
      });
    }
  },

  // PUT /productos/:id
  async actualizarProducto(req, res) {
    const id = Number(req.params.id);
    const { nombre, precio, stock } = req.body;

    if (!Number.isInteger(id) || !nombre || precio === undefined || stock === undefined) {
      return res.status(400).json({
        mensaje: "El id, 'nombre', 'precio' y 'stock' son obligatorios",
      });
    }

    try {
      const [filas] = await Producto.update(
        { nombre, precio, stock },
        { where: { id_productos: id } }
      );

      if (filas === 0) {
        return res.status(404).json({ mensaje: 'Producto no encontrado' });
      }

      const productoActualizado = await Producto.findByPk(id, {
        attributes: [['id_productos', 'id'], 'id_productos', 'nombre', 'precio', 'stock'],
      });

      res.status(200).json(productoActualizado);
    } catch (error) {
      res.status(500).json({ mensaje: 'No se pudo actualizar el producto' });
    }
  },

  // DELETE /productos/:id
  async eliminarProducto(req, res) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ mensaje: 'El id del producto no es válido' });
    }

    try {
      const producto = await Producto.findByPk(id, {
        attributes: [['id_productos', 'id'], 'id_productos', 'nombre', 'precio', 'stock'],
      });

      if (!producto) {
        return res.status(404).json({ mensaje: 'Producto no encontrado' });
      }

      await producto.destroy();

      res.status(200).json({ mensaje: 'Producto eliminado', producto });
    } catch (error) {
      if (error.parent && error.parent.code === '23503') {
        return res.status(409).json({
          mensaje: 'No se puede eliminar el producto porque tiene compras asociadas',
        });
      }

      res.status(500).json({ mensaje: 'No se pudo eliminar el producto' });
    }
  },
};

module.exports = productoController;
