//Api/detallescompras
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const detalles = await prisma.detalleCompras.findMany({
            where: {
                estado: 0
            },
            include: {
                Producto: true,
                Lote: {
                    select: {
                        id: true,
                        numeroLote: true,
                        fechaVencimiento: true,
                        cantidadInicial: true,
                        estado: true,
                        detalleCompraID: true
                    }
                }
            }
        });

        if (detalles.length > 0) {
            return NextResponse.json({ data: detalles }, { status: 200 });
        } else {
            return NextResponse.json({ data: "No hay compras realizadas" }, { status: 404 });
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error" }, { status: 505 });
    }
}