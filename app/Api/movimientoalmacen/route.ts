// app/api/movimientoalmacen/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const movimientos = await prisma.movimientoAlmacen.findMany({
            include: {
                Lote: true,
                UnidadMedida: true,
                Producto: true
            }
        });
        if (movimientos.length > 0) {
            return NextResponse.json({ data: movimientos }, { status: 200 });
        } else {
            return NextResponse.json({ data: "No hay movimientos de almacén registrados" }, { status: 404 });
        }
    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Error al obtener los movimientos de almacén" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            fechaRegistro,
            cantidadPaquetes,
            cantidadUnidades,
            cantidadTotal,
            tipo,
            productoID,
            detalleComprasID,
            usuarioRegistro,
            unidadMedidaID,
            loteID  // Agregamos el loteID al destructuring
        } = body;

        // Verificamos si hay un lote asignado
        const detalleCompra = await prisma.detalleCompras.findUnique({
            where: { id: detalleComprasID },
            include: {
                Lote: true
            }
        });

        // Si no se proporciona loteID, usamos el primer lote del detalle de compra
        const loteAsignado = loteID || detalleCompra?.Lote[0]?.id;

        const nuevoMovimiento = await prisma.movimientoAlmacen.create({
            data: {
                fechaRegistro: new Date(fechaRegistro),
                cantidadPaquetes,
                cantidadUnidades,
                cantidadTotal,
                tipo,
                productoID,
                detalleComprasID,
                usuarioRegistro,
                unidadMedidaID,
                loteID: loteAsignado  // Incluimos el loteID en el create
            },
            include: {
                Lote: true,
                UnidadMedida: true,
                Producto: true
            }
        });

        return NextResponse.json({ data: nuevoMovimiento }, { status: 201 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Error al crear el movimiento de almacén" }, { status: 500 });
    }
}