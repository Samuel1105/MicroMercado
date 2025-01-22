// app/api/detallescompras/[id]/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { estado } = body;

    const updatedDetalleCompra = await prisma.detalleCompras.update({
      where: { id: id },
      data: { estado: estado }
    });

    return NextResponse.json({ data: updatedDetalleCompra }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Error al actualizar el detalle de compra" }, { status: 500 });
  }
}