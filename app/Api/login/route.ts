// app/Api/login/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { correo, contraseña } = await request.json();

    const persona = await prisma.persona.findFirst({
      where: {
        correo: correo,
        contrase_a: contraseña
      }
    });

    if (persona) {
      return NextResponse.json({ data: persona }, { status: 200 });
    } else {
      return NextResponse.json({ message: "No se encontró el usuario" }, { status: 404 });
    }

  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }
}
