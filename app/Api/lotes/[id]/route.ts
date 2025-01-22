// app/Api/lotes/[id]/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productoId = parseInt(params.id);

    const lotes = await prisma.lote.findMany({
      where: {
        DetalleCompras: {
          productoID: productoId
        }
      },
      select: {
        id: true,
        numeroLote: true,
        fechaVencimiento: true,
        cantidadInicial: true,
        estado: true
      },
      orderBy: {
        fechaVencimiento: 'asc'
      }
    });

    if (lotes.length > 0) {
      return NextResponse.json({
        data: lotes,
        message: "Lotes encontrados exitosamente"
      }, { status: 200 });
    } else {
      return NextResponse.json({
        data: [],
        message: "No se encontraron lotes para este producto"
      }, { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching lots:", error);
    return NextResponse.json({
      message: "Error al obtener los lotes",
      error: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 });
  }
}