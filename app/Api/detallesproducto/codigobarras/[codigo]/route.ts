//Api/detallesproducto/codigobarras/[codigo]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { codigo: string } }
) {
  try {
    const codigo = params.codigo;

    // Primero, intentamos una búsqueda exacta
    let detallesProducto = await prisma.detallesProducto.findFirst({
      where: {
        codigoBarras: codigo,
        estado: 1
      },
      include: {
        Producto: true,
      },
    });

    

    if (!detallesProducto) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Transformamos la respuesta para que coincida con la estructura esperada por el frontend
    const respuesta = {
      id: detallesProducto.id,
      productoID: detallesProducto.productoID,
      codigoBarras: detallesProducto.codigoBarras,
      fechaVencimiento: detallesProducto.fechaVencimiento,
      cantidad: detallesProducto.cantidad,
      Producto: {
        id: detallesProducto.Producto.id,
        nombre: detallesProducto.Producto.nombre,
        descripcion: detallesProducto.Producto.descripcion,
        precioVenta: detallesProducto.Producto.precioVenta,
        stock: detallesProducto.Producto.stock,
      },
    };

    return NextResponse.json(respuesta);
  } catch (error) {
    console.error("Error al buscar el producto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
