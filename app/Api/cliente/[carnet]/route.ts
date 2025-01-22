// /app/api/cliente/carnet/[carnet]/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { carnet: string } }
) {
  const carnet = params.carnet;

  try {
    const cliente = await prisma.cliente.findFirst({
      where: {
        carnet: carnet,
      },
    });

    if (!cliente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    return NextResponse.json(cliente);
  } catch (error) {
    console.error("Error al buscar el cliente:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}