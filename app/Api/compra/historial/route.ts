import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type CompraWithDetails = Prisma.ComprasGetPayload<{
  include: {
    DetalleCompras: {
      include: {
        Producto: true;
        IngresoAlmacen: true;
        MovimientoAlmacen: true;
      };
    };
  };
}>;

type FormattedCompra = {
  id: number;
  fechaCompra: Date | null;
  subtotal: Prisma.Decimal;
  descuento: Prisma.Decimal;
  total: Prisma.Decimal;
  cantidadProductos: number;
  estado: 'Registrado' | 'Pendiente';
  detalles: Array<{
    producto: string;
    cantidadComprada: number;
    unidadesPorPaquete: number | null;
    totalUnidades: number;
    precioUnitario: Prisma.Decimal | null;
    subtotal: Prisma.Decimal;
    descuento: Prisma.Decimal | null;
    total: Prisma.Decimal;
    ingresado: boolean;
    cantidadIngresada: number;
    cantidadPendiente: number;
  }>;
};

export async function GET() {
  try {
    const historialCompras = await prisma.compras.findMany({
      include: {
        DetalleCompras: {
          include: {
            Producto: true,
            IngresoAlmacen: true,
            MovimientoAlmacen: true,
          },
        },
      },
      orderBy: {
        fechaRegistro: 'desc',
      },
    });

    const formattedHistorial: FormattedCompra[] = historialCompras.map((compra: CompraWithDetails) => {
      const detalles = compra.DetalleCompras.map((detalle) => {
        const totalUnidadesCompradas = (detalle.cantidadMayor || 0) * (detalle.unidadesPorMayor || 1) + (detalle.cantidadIndividual || 0);
        
        const cantidadIngresada = detalle.MovimientoAlmacen.reduce((total, movimiento) => {
          if (movimiento.tipo === 1) { // Asumiendo que 1 es el tipo para ingresos
            return total + (movimiento.cantidadPaquetes || 0) * (detalle.unidadesPorMayor || 1) + movimiento.cantidadUnidades;
          }
          return total;
        }, 0);

        return {
          producto: detalle.Producto.nombre,
          cantidadComprada: detalle.cantidadMayor || detalle.cantidadIndividual || 0,
          unidadesPorPaquete: detalle.unidadesPorMayor,
          totalUnidades: totalUnidadesCompradas,
          precioUnitario: detalle.cantidadMayor && detalle.cantidadMayor > 0 ? detalle.precioUnitarioMayor : detalle.precioUnitario,
          subtotal: detalle.subtotal,
          descuento: detalle.descuento,
          total: detalle.total,
          ingresado: cantidadIngresada >= totalUnidadesCompradas,
          cantidadIngresada: cantidadIngresada,
          cantidadPendiente: Math.max(0, totalUnidadesCompradas - cantidadIngresada),
        };
      });

      const estado = detalles.every(d => d.ingresado) ? 'Registrado' : 'Pendiente';

      return {
        id: compra.id,
        fechaCompra: compra.fechaRegistro,
        subtotal: compra.subtotal,
        descuento: compra.descuento,
        total: compra.total,
        cantidadProductos: compra.DetalleCompras.length,
        estado: estado,
        detalles: detalles,
      };
    });

    return NextResponse.json(formattedHistorial);
  } catch (error) {
    console.error("Error al obtener el historial de compras:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}