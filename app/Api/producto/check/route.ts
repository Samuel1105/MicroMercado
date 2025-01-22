import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const nombre = searchParams.get('nombre');
    const categoriaId = searchParams.get('categoriaId');
    const proveedorId = searchParams.get('proveedorId');

    if (!nombre || !categoriaId || !proveedorId) {
        return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 });
    }

    try {
        const existingProduct = await prisma.producto.findFirst({
            where: {
                nombre: nombre,
                categoriaID: parseInt(categoriaId),
                proveedorID: parseInt(proveedorId)
            }
        });

        return NextResponse.json({ exists: !!existingProduct });
    } catch (error) {
        console.error("Error checking product existence:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}