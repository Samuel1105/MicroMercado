export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Asegúrate de que esta ruta sea correcta

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const [ventas, total] = await Promise.all([
      prisma.venta.findMany({
        where: {
          fechaRegistro: {
            gte: fechaInicio ? new Date(fechaInicio) : undefined,
            lte: fechaFin ? new Date(fechaFin) : undefined,
          },
        },
        include: {
          Cliente: true,
          DetalleVentas: {
            include: {
              Producto: true,
            },
          },
        },
        orderBy: {
          fechaRegistro: 'desc',
        },
        skip: (page - 1) * limit, // Saltar elementos
        take: limit, // Limitar la cantidad de resultados
      }),
      prisma.venta.count({ // Contar total de ventas
        where: {
          fechaRegistro: {
            gte: fechaInicio ? new Date(fechaInicio) : undefined,
            lte: fechaFin ? new Date(fechaFin) : undefined,
          },
        },
      }),
    ]);

    return NextResponse.json({ items: ventas, total });
  } catch (error) {
    console.error("Error al obtener las ventas:", error);
    return NextResponse.json({ error: "Error al obtener las ventas" }, { status: 500 });
  }
}
