import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 0, 1);
        const endDate = new Date(currentYear, 11, 31);

        const compras = await prisma.compras.groupBy({
            by: ['fechaRegistro'],
            _sum: {
                total: true,
            },
            where: {
                fechaRegistro: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        const ventas = await prisma.venta.groupBy({
            by: ['fechaRegistro'],
            _sum: {
                total: true,
            },
            where: {
                fechaRegistro: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
            month: new Date(currentYear, i).toLocaleString('default', { month: 'short' }),
            compras: 0,
            ventas: 0,
        }));

        compras.forEach((compra) => {
            const month = new Date(compra.fechaRegistro!).getMonth();
            monthlyData[month].compras += Number(compra._sum.total);
        });

        ventas.forEach((venta) => {
            const month = new Date(venta.fechaRegistro!).getMonth();
            monthlyData[month].ventas += Number(venta._sum.total);
        });

        return NextResponse.json({ data: monthlyData }, { status: 200 });
    } catch (error) {
        console.error('Error fetching monthly data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}