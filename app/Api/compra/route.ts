// app/api/compra/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Definir interfaces para los tipos
interface Lote {
  numeroLote: string;
  fechaVencimiento: Date | string;
  cantidad: number;
}

interface DetalleCompra {
  productoID: number;
  cantidadMayor: number;
  precioUnitarioMayor: number;
  unidadesPorMayor: number;
  unidadMedidaMayorId: number | null;
  cantidadIndividual: number;
  precioUnitario: number;
  descuentoMayor: number;
  descuentoIndividual: number;
  subtotal: number;
  descuento: number;
  total: number;
  lotes: Lote[];
}

interface DatosCompra {
  subtotal: number;
  descuentoTotal: number;
  total: number;
  user: number;
}

export async function POST(request: Request) {
  try {
    const { datosCompra, detalleCompra }: { 
      datosCompra: DatosCompra; 
      detalleCompra: DetalleCompra[] 
    } = await request.json();

    const result = await prisma.$transaction(async (prisma) => {
      // 1. Crear la compra
      const compra = await prisma.compras.create({
        data: {
          subtotal: datosCompra.subtotal,
          descuento: datosCompra.descuentoTotal,
          total: datosCompra.total,
          usuarioIdRegistro: datosCompra.user,
        },
      });

      // 2. Procesar cada detalle de compra y sus lotes
      for (const detalle of detalleCompra) {
        const detalleCreado = await prisma.detalleCompras.create({
          data: {
            compraID: compra.id,
            productoID: detalle.productoID,
            cantidadMayor: detalle.cantidadMayor || 0,
            precioUnitarioMayor: detalle.precioUnitarioMayor || 0,
            unidadesPorMayor: detalle.unidadesPorMayor || 0,
            unidadMedidaMayorId: detalle.unidadMedidaMayorId || null,
            cantidadIndividual: detalle.cantidadIndividual || 0,
            precioUnitario: detalle.precioUnitario || 0,
            descuentoMayor: detalle.descuentoMayor || 0,
            descuentoIndividual: detalle.descuentoIndividual || 0,
            subtotal: detalle.subtotal,
            descuento: detalle.descuento,
            total: detalle.total,
            usuarioRegistro: datosCompra.user,
          },
        });

        if (detalle.lotes && detalle.lotes.length > 0) {
          const cantidadTotal = detalle.cantidadMayor 
            ? detalle.cantidadMayor * detalle.unidadesPorMayor 
            : detalle.cantidadIndividual;

          const cantidadLotes = detalle.lotes.reduce((sum: number, lote: Lote) => sum + lote.cantidad, 0);

          if (cantidadLotes !== cantidadTotal) {
            throw new Error(`La cantidad total de los lotes debe coincidir con la cantidad del producto ${detalle.productoID}`);
          }

          // Validar lotes duplicados
          const lotesExistentes = await prisma.lote.findMany({
            where: {
              DetalleCompras: {
                productoID: detalle.productoID
              },
              numeroLote: {
                in: detalle.lotes.map((l: Lote) => l.numeroLote)
              }
            }
          });

          if (lotesExistentes.length > 0) {
            throw new Error(`Ya existen lotes con los números: ${lotesExistentes.map(l => l.numeroLote).join(', ')} para este producto`);
          }

          // Crear los lotes
          await prisma.lote.createMany({
            data: detalle.lotes.map((lote: Lote) => {
              let fechaVencimiento = null;

              if (lote.fechaVencimiento) {
                const fecha = new Date(lote.fechaVencimiento);
                // Verificar si es una fecha válida y no es la fecha 0
                if (!isNaN(fecha.getTime()) && fecha.getTime() !== 0) {
                  fechaVencimiento = fecha;
                }
              }

              return {
                numeroLote: lote.numeroLote,
                fechaVencimiento: fechaVencimiento,
                detalleCompraID: detalleCreado.id,
                cantidadInicial: lote.cantidad,
                estado: 1,
                usuarioRegistro: datosCompra.user,
              };
            }),
          });

         
        } else {
          throw new Error(`Se requieren lotes para el producto ${detalle.productoID}`);
        }
      }

      return compra;
    });

    return NextResponse.json(
      { message: "Compra realizada con éxito", result }, 
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Error en la creación de la compra:", error);
    const errorMessage = error.message || "Error al realizar la compra";
    const statusCode = error.code === "P2002" ? 409 : 500;

    return NextResponse.json(
      { 
        message: "Error al realizar la compra", 
        error: errorMessage 
      }, 
      { status: statusCode }
    );
  }
}