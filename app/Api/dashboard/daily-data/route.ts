import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        const ventas = await prisma.venta.groupBy({
            by: ['fechaRegistro'],
            _sum: {
                total: true,
            },
            where: {
                fechaRegistro: {
                    gte: last30Days,
                },
            },
            orderBy: {
                fechaRegistro: 'asc',
            },
        });

        const dailyData = ventas.map((venta) => ({
            date: new Date(venta.fechaRegistro!).toISOString().split('T')[0],
            ventas: Number(venta._sum.total),
        }));

        if (dailyData.length > 0) {
            return NextResponse.json({ data: dailyData }, { status: 200 });
        } else {
            return NextResponse.json({ message: "No se encontraron datos de ventas para los últimos 30 días" }, { status: 404 });
        }
    } catch (error) {
        console.error('Error fetching daily data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}