// app/api/historicoalmacen/route.ts
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const detallesCompras = await prisma.detalleCompras.findMany({
      include: {
        Producto: true,
        IngresoAlmacen: true,
        MovimientoAlmacen: {
          orderBy: {
            fechaRegistro: 'asc'
          }
        },
        Compras: true,
      },
      orderBy: {
        fechaRegistro: 'desc',
      },
    });

    const historicoAlmacen = detallesCompras.map(detalle => {
      const cantidadTotal = detalle.cantidadMayor
        ? detalle.cantidadMayor * (detalle.unidadesPorMayor || 1)
        : detalle.cantidadIndividual || 0;
      const unidadesPorPaquete = detalle.unidadesPorMayor || 1;

      // Los ingresos son la cantidad comprada
      const ingresos = {
        cantidadMayor: detalle.cantidadMayor || 0,
        cantidadIndividual: detalle.cantidadIndividual || 0,
        total: cantidadTotal,
        unidadMedidaMayorId: detalle.unidadMedidaMayorId
      };

      // Los egresos son cada movimiento individual
      const egresos = detalle.MovimientoAlmacen.map(movimiento => ({
        id: movimiento.id,
        fecha: movimiento.fechaRegistro,
        cantidadMayor: Math.floor(movimiento.cantidadTotal / unidadesPorPaquete),
        cantidadIndividual: movimiento.cantidadTotal % unidadesPorPaquete,
        total: movimiento.cantidadTotal,
        unidadMedidaMayorId: detalle.unidadMedidaMayorId
      }));

      // Calculamos la cantidad restante
      const totalEgresos = egresos.reduce((sum, egreso) => sum + egreso.total, 0);
      const cantidadRestante = cantidadTotal - totalEgresos;

      // Ajustamos el cálculo de la cantidad restante
      const cantidadRestanteFormateada = detalle.unidadMedidaMayorId
        ? {
            cantidadMayor: Math.floor(cantidadRestante / unidadesPorPaquete),
            cantidadIndividual: cantidadRestante % unidadesPorPaquete,
            total: cantidadRestante,
            unidadMedidaMayorId: detalle.unidadMedidaMayorId
          }
        : {
            cantidadMayor: 0,
            cantidadIndividual: cantidadRestante,
            total: cantidadRestante,
            unidadMedidaMayorId: null
          };

      return {
        id: detalle.id,
        fechaCompra: detalle.Compras.fechaRegistro,
        producto: detalle.Producto.nombre,
        ingresos: ingresos,
        egresos: egresos,
        cantidadRestante: cantidadRestanteFormateada,
      };
    });

    return NextResponse.json({ data: historicoAlmacen });
  } catch (error) {
    console.error('Error al obtener el histórico de almacén:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}