const Compra = require('../models/compra');
const { obtenerCliente } = require('../services/clienteService');
const { obtenerProducto } = require('../services/productoService');

function calcularTotal(precio, cantidad) {
  const precioEnCentavos = Math.round(Number(precio) * 100);
  const totalEnCentavos = precioEnCentavos * cantidad;

  if (
    !Number.isSafeInteger(precioEnCentavos) ||
    precioEnCentavos < 0 ||
    !Number.isSafeInteger(totalEnCentavos) ||
    totalEnCentavos > 9999999999
  ) {
    throw new RangeError('El precio o el total están fuera del rango permitido');
  }

  return (totalEnCentavos / 100).toFixed(2);
}

// Formatea una fila de Compra al shape de respuesta esperado
function formatearCompra(compra) {
  return {
    id: compra.id_compras,
    clienteId: compra.id_clientes,
    productoId: compra.id_productos,
    cantidad: compra.cantidad,
    total: compra.total,
    fecha: compra.fecha_compra,
  };
}

const compraController = {
  // GET /compras
  async obtenerCompras(req, res) {
    try {
      const compras = await Compra.findAll({
        order: [['id_compras', 'ASC']],
      });
      res.status(200).json(compras.map(formatearCompra));
    } catch (error) {
      res.status(500).json({ mensaje: 'No se pudieron obtener las compras' });
    }
  },

  // GET /compras/:id
  async obtenerCompraPorId(req, res) {
    const id = Number(req.params.id);

    try {
      const compra = await Compra.findByPk(id);

      if (!compra) {
        return res.status(404).json({ mensaje: 'Compra no encontrada' });
      }

      res.status(200).json(formatearCompra(compra));
    } catch (error) {
      res.status(500).json({ mensaje: 'No se pudo obtener la compra' });
    }
  },

  // POST /compras
  async crearCompra(req, res) {
    const { clienteId, productoId, cantidad } = req.body;
    const clienteIdNumero = Number(clienteId);
    const productoIdNumero = Number(productoId);
    const cantidadNumero = Number(cantidad);

    if (
      !Number.isInteger(clienteIdNumero) || clienteIdNumero <= 0 ||
      !Number.isInteger(productoIdNumero) || productoIdNumero <= 0 ||
      !Number.isInteger(cantidadNumero) || cantidadNumero <= 0
    ) {
      return res.status(400).json({
        mensaje: "Los campos 'clienteId', 'productoId' y 'cantidad' deben ser válidos",
      });
    }

    let cliente;
    let producto;

    try {
      cliente = await obtenerCliente(clienteIdNumero);
      producto = await obtenerProducto(productoIdNumero);
    } catch (error) {
      return res.status(503).json({
        mensaje: 'No se pudo validar la compra porque uno de los servicios no respondió',
        detalle: error.message,
      });
    }

    if (!cliente) {
      return res.status(404).json({ mensaje: `El cliente ${clienteId} no existe` });
    }

    if (!producto) {
      return res.status(404).json({ mensaje: `El producto ${productoId} no existe` });
    }

    if (Number(producto.stock) < cantidadNumero) {
      return res.status(400).json({
        mensaje: `Stock insuficiente. Disponible: ${producto.stock}, solicitado: ${cantidadNumero}`,
      });
    }

    try {
      const nuevaCompra = await Compra.create({
        id_clientes: clienteIdNumero,
        id_productos: productoIdNumero,
        cantidad: cantidadNumero,
        total: calcularTotal(producto.precio, cantidadNumero),
        fecha_compra: new Date(),
      });

      res.status(201).json(formatearCompra(nuevaCompra));
    } catch (error) {
      if (error instanceof RangeError) {
        return res.status(400).json({ mensaje: 'El precio o el total están fuera del rango permitido' });
      }

      res.status(500).json({
        mensaje: 'No se pudo crear la compra' + (error.message ? `: ${error.message}` : ''),
      });
    }
  },

  // PUT /compras/:id
  async actualizarCompra(req, res) {
    const id = Number(req.params.id);
    const { clienteId, productoId, cantidad } = req.body;
    const clienteIdNumero = Number(clienteId);
    const productoIdNumero = Number(productoId);
    const cantidadNumero = cantidad === undefined ? undefined : Number(cantidad);

    if (
      !Number.isInteger(id) || id <= 0 ||
      !Number.isInteger(clienteIdNumero) || clienteIdNumero <= 0 ||
      !Number.isInteger(productoIdNumero) || productoIdNumero <= 0 ||
      (cantidadNumero !== undefined &&
        (!Number.isInteger(cantidadNumero) || cantidadNumero <= 0))
    ) {
      return res.status(400).json({
        mensaje: "El id, 'clienteId' y 'productoId' deben ser válidos; 'cantidad', si se envía, debe ser un entero positivo",
      });
    }

    try {
      const compra = await Compra.findByPk(id);

      if (!compra) {
        return res.status(404).json({ mensaje: 'Compra no encontrada' });
      }

      const productoCambio = productoIdNumero !== compra.id_productos;
      const debeRecalcularTotal = productoCambio || cantidadNumero !== undefined;
      const cantidadFinal = cantidadNumero ?? compra.cantidad;
      const datosActualizacion = {
        id_clientes: clienteIdNumero,
        id_productos: productoIdNumero,
      };

      if (cantidadNumero !== undefined) {
        datosActualizacion.cantidad = cantidadNumero;
      }

      if (debeRecalcularTotal) {
        if (!Number.isInteger(cantidadFinal) || cantidadFinal <= 0) {
          return res.status(400).json({
            mensaje: "Envía 'cantidad' para recalcular el total de esta compra",
          });
        }

        let producto;
        try {
          producto = await obtenerProducto(productoIdNumero);
        } catch (error) {
          return res.status(503).json({
            mensaje: 'No se pudo recalcular el total porque el servicio de productos no respondió',
            detalle: error.message,
          });
        }

        if (!producto) {
          return res.status(404).json({ mensaje: `El producto ${productoIdNumero} no existe` });
        }

        datosActualizacion.total = calcularTotal(producto.precio, cantidadFinal);
      }

      await compra.update(datosActualizacion);

      const compraActualizada = await Compra.findByPk(id);
      res.status(200).json(formatearCompra(compraActualizada));
    } catch (error) {
      if (error instanceof RangeError) {
        return res.status(400).json({ mensaje: 'El precio o el total están fuera del rango permitido' });
      }

      if (error.parent && error.parent.code === '23503') {
        return res.status(400).json({
          mensaje: 'El cliente o producto indicado no existe',
        });
      }

      res.status(500).json({ mensaje: 'No se pudo actualizar la compra' });
    }
  },

  // DELETE /compras/:id
  async eliminarCompra(req, res) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ mensaje: 'El id de la compra no es válido' });
    }

    try {
      const compra = await Compra.findByPk(id);

      if (!compra) {
        return res.status(404).json({ mensaje: 'Compra no encontrada' });
      }

      await compra.destroy();

      res.status(200).json({ mensaje: 'Compra eliminada', compra: formatearCompra(compra) });
    } catch (error) {
      res.status(500).json({ mensaje: 'No se pudo eliminar la compra' });
    }
  },
};

module.exports = compraController;
