import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

interface Params {
    params: { id: string }
}

export async function GET(request: Request, { params }: Params) {
    try {
        const persona = await prisma.persona.findFirst({
            where: {
                estado: 1,
                id: Number(params.id)
            }
        })
        if (persona) {
            return NextResponse.json({ data: persona }, { status: 200 })
        } else {
            return NextResponse.json({ message: "No se pudo encontrar a la persona" }, { status: 404 })
        }
    } catch (error) {
        console.log(error)
        return NextResponse.json({ message: error }, { status: 500 })
    }
}

export async function PUT(request: Request, { params }: Params) {
    try {
        const { primerNombre, segundoNombre, apellidoPaterno, apellidoMaterno, correo, celular, rol, contraseña, usuarioid } = await request.json();
        
        // Verificar si existe otro usuario con el mismo correo (excluyendo el usuario actual)
        const existingUser = await prisma.persona.findFirst({
            where: {
                correo: correo,
                estado: 1,
                NOT: {
                    id: parseInt(params.id)
                }
            }
        });

        if (existingUser) {
            return NextResponse.json(
                {
                    error: "DUPLICATE_EMAIL",
                    message: "Ya existe otro usuario registrado con este correo electrónico"
                },
                { status: 400 }
            );
        }

        // Construir el objeto de actualización dinámicamente
        const updateData: any = {
            primerNombre,
            segundoNombre,
            apellidoPaterno,
            apellidoMaterno,
            correo,
            celular,
            rol,
            fechaActualizacion: new Date(),
            usuarioIdActualizacion: usuarioid,
        };

        // Si se proporcionó una contraseña, agregarla al objeto de actualización
        if (contraseña) {
            updateData.contrase_a = contraseña;
        }

        // Realizar la actualización en la base de datos
        const persona = await prisma.persona.update({
            where: {
                id: parseInt(params.id),
            },
            data: updateData
        });

        return new Response(JSON.stringify({ success: true, data: persona }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.log(error)
        return NextResponse.json({ message: error }, { status: 500 })
    }
}

export async function DELETE(request: Request, { params }: Params) {
    try {
        const { userid } = await request.json()
        const persona = await prisma.persona.update({
            where: {
                id: parseInt(params.id)
            },
            data: {
                fechaActualizacion: new Date(),
                usuarioIdActualizacion: userid,
                estado: 0
            }
        })
        if (persona) {
            return new Response(JSON.stringify({ success: true, data: persona }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            return new Response(JSON.stringify({ success: false }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error) {
        console.log(error)
        return NextResponse.json({ message: error }, { status: 500 })
    }
}