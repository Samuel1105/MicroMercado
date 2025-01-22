//Api/cliente/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { carnet, nombre, correo } = body;

    const nuevoCliente = await prisma.cliente.create({
      data: {
        carnet,
        nombre,
        correo,
        usuarioIdRegistro: 1, // Asumiendo un valor por defecto, ajusta según tus necesidades
      },
    });

    return NextResponse.json(nuevoCliente, { status: 201 });
  } catch (error) {
    console.error("Error al registrar el nuevo cliente:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}