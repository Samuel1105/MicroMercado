import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const usuario = await prisma.persona.findMany({
            where: {
                estado: 1
            },
            select: {
                id: true,
                primerNombre: true,
                segundoNombre: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
                correo: true,
                celular: true,
                rol: true,
                estado: true,
                fechaRegistro: true,
                usuarioIdRegistro: true,
                fechaActualizacion: true,
                usuarioIdActualizacion: true,
            }
        });
        if (usuario.length > 0) {
            return NextResponse.json({ data: usuario }, { status: 200 });
        } else {
            return NextResponse.json({ message: "No se encontró ningún usuario" }, { status: 404 });
        }
    } catch (error) {
        console.log(error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 500 });
        }
    }
}

export async function POST(request: Request) {
    try {
        const { primerNombre, segundoNombre, apellidoPaterno, apellidoMaterno, correo, celular, rol, contraseña, usuarioid } = await request.json();

        // Verificar si ya existe un usuario con el mismo correo
        const existingUser = await prisma.persona.findFirst({
            where: {
                correo: correo,
                estado: 1 // Solo verificar usuarios activos
            }
        });

        if (existingUser) {
            return NextResponse.json(
                { 
                    error: "DUPLICATE_EMAIL",
                    message: "Ya existe un usuario registrado con este correo electrónico"
                }, 
                { status: 400 }
            );
        }

        const persona = await prisma.persona.create({
            data: {
                primerNombre: primerNombre,
                segundoNombre: segundoNombre,
                apellidoPaterno: apellidoPaterno,
                apellidoMaterno: apellidoMaterno,
                correo: correo,
                celular: celular,
                rol: rol,
                contrase_a: contraseña,
                usuarioIdRegistro: usuarioid
            }
        });

        if (persona) {
            return NextResponse.json({ data: persona }, { status: 200 });
        } else {
            return NextResponse.json({ message: "Error al insertar el usuario" }, { status: 404 });
        }
    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: error }, { status: 500 });
    }
}