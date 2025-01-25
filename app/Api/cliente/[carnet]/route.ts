// /app/api/cliente/[carnet]/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { carnet: string } }
) {
  const carnet = params.carnet;
  try {
    const clientes = await prisma.cliente.findMany({
      where: {
        carnet: {
          startsWith: carnet
        }
      },
      take: 5
    });
    return NextResponse.json(clientes);
  } catch (error) {
    console.error("Error al buscar clientes:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}