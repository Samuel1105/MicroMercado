// app/api/ingresoalmacen/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const ingresos = await prisma.ingresoAlmacen.findMany();

        if (ingresos.length > 0) {
            return NextResponse.json({ data: ingresos }, { status: 200 });
        } else {
            return NextResponse.json({ data: "No hay ingresos registrados" }, { status: 404 });
        }
    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { detalleCompraID, cantidadIngresada, usuarioIngreso } = body;

        const nuevoIngreso = await prisma.ingresoAlmacen.create({
            data: {
                detalleCompraID,
                cantidadIngresada,
                usuarioIngreso,
            },
        });

        return NextResponse.json({ data: nuevoIngreso }, { status: 201 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Error al crear el ingreso" }, { status: 500 });
    }
}