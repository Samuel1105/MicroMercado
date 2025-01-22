// app/Api/reportes/estado-financiero/route.ts
export const dynamic = 'force-dynamic'
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let startDate = searchParams.get('startDate');
    let endDate = searchParams.get('endDate');

    // Si no se proporcionan fechas, usar el último mes por defecto
    if (!startDate || !endDate) {
      const today = new Date();
      endDate = today.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()).toISOString().split('T')[0];
    }

    // Función para generar un array de fechas entre startDate y endDate
    const getDatesInRange = (start: Date, end: Date) => {
      const dates = [];
      let currentDate = new Date(start);
      while (currentDate <= end) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dates;
    };

    const dateRange = getDatesInRange(new Date(startDate), new Date(endDate));

    // Fetch daily sales (ingresos)
    const ventas = await prisma.venta.groupBy({
      by: ['fechaRegistro'],
      _sum: {
        total: true,
      },
      where: {
        fechaRegistro: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });

    // Fetch daily purchases (gastos)
    const compras = await prisma.compras.groupBy({
      by: ['fechaRegistro'],
      _sum: {
        total: true,
      },
      where: {
        fechaRegistro: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });

    // Crear un mapa para facilitar el acceso a los datos por fecha
    const ventasMap = new Map(ventas.map(v => [v.fechaRegistro?.toISOString().split('T')[0], v._sum.total?.toNumber() || 0]));
    const comprasMap = new Map(compras.map(c => [c.fechaRegistro?.toISOString().split('T')[0], c._sum.total?.toNumber() || 0]));

    // Generar datos financieros diarios
    const financialData = dateRange.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const ingresos = ventasMap.get(dateStr) || 0;
      const gastos = comprasMap.get(dateStr) || 0;
      const utilidades = ingresos - gastos;
      return {
        name: dateStr,
        ingresos,
        gastos,
        utilidades
      };
    });

    // Calcular totales
    const totales = financialData.reduce((acc, curr) => {
      acc.ingresos += curr.ingresos;
      acc.gastos += curr.gastos;
      acc.utilidades += curr.utilidades;
      return acc;
    }, { ingresos: 0, gastos: 0, utilidades: 0 });

    return NextResponse.json({
      data: financialData,
      totales,
      period: { startDate, endDate }
    }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener el estado financiero:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}