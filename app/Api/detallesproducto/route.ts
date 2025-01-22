import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productoID, codigoBarras, fechaVencimiento, cantidad } = body;

    const nuevoDetalle = await prisma.detallesProducto.create({
      data: {
        productoID,
        codigoBarras,
        //fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        cantidad,
      },
    });

    return NextResponse.json({ data: nuevoDetalle }, { status: 201 });
  } catch (error) {
    console.error('Error al crear detalle de producto:', error);
    return NextResponse.json({ message: "Error al crear el detalle de producto" }, { status: 500 });
  }
}