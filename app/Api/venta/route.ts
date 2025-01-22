// app/api/venta/route.ts
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { venta, detalles } = body;

    // Usar el ID del cliente anónimo si no se proporciona un clienteID
    const clienteID = venta.clienteID || 2; // 2 es el ID del cliente anónimo

    // Crear la venta
    const ventaCreada = await prisma.venta.create({
      data: {
        clienteID: clienteID,
        subtotal: venta.subtotal,
        descuento: venta.descuento,
        total: venta.total,
        usuarioIdRegistro: venta.usuarioIdRegistro,
        montoRecibido: venta.montoRecibido,
        cambio: venta.cambio,
        DetalleVentas: {
          create: detalles.map((detalle: any) => ({
            productoID: detalle.productoID,
            cantidad: detalle.cantidad,
            precioUnitario: detalle.precioUnitario,
            descuento: detalle.descuento,
            subtotal: detalle.subtotal,
            total: detalle.total,
          }))
        }
      },
      include: {
        DetalleVentas: true
      }
    });

    // Actualizar el stock de los productos y el estado de los detalles del producto
    for (const detalle of detalles) {
      // Actualizar el stock del producto
      await prisma.producto.update({
        where: { id: detalle.productoID },
        data: { stock: { decrement: detalle.cantidad } }
      });

      // Si el producto tiene código de barras, actualizar el estado del detalle del producto
      if (detalle.codigoBarras) {
        await prisma.detallesProducto.updateMany({
          where: {
            productoID: detalle.productoID,
            codigoBarras: detalle.codigoBarras
          },
          data: {
            estado: 0 // Cambiamos el estado a 0 para indicar que ha sido vendido
          }
        });
      }
    }

    return NextResponse.json({
      message: 'Venta procesada con éxito',
      ventaID: ventaCreada.id,
      detalles: ventaCreada.DetalleVentas
    });
  } catch (error) {
    console.error('Error al procesar la venta:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}