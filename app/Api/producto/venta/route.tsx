// app/api/producto/venta/route.ts
export const dynamic = 'force-dynamic'
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const skip = parseInt(url.searchParams.get('skip') || '0');
    const take = parseInt(url.searchParams.get('take') || '10');
    const search = url.searchParams.get('search') || '';

    console.log(`Parámetros recibidos: skip=${skip}, take=${take}, search=${search}`);

    const where = {
      estado: 1,
      stock: { gt: 0 },
      nombre: { contains: search},
    };

    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          precioVenta: true,
          stock: true,
        },
        skip,
        take,
      }),
      prisma.producto.count({ where }),
    ]);

    console.log(`Productos encontrados: ${productos.length}, Total: ${total}`);

    return NextResponse.json({
      data: productos,
      total,
    });
  } catch (error: any) {
    console.error('Error detallado al obtener productos:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}