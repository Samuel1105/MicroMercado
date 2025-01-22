import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const topProducts = await prisma.detalleVentas.groupBy({
            by: ['productoID'],
            _sum: {
                cantidad: true,
            },
            orderBy: {
                _sum: {
                    cantidad: 'desc',
                },
            },
            take: 5,
        });

        const productsWithNames = await Promise.all(
            topProducts.map(async (product) => {
                const productInfo = await prisma.producto.findUnique({
                    where: { id: product.productoID },
                    select: { nombre: true },
                });
                return {
                    name: productInfo?.nombre || 'Desconocido',
                    quantity: product._sum.cantidad || 0,
                };
            })
        );

        return NextResponse.json({ data: productsWithNames }, { status: 200 });
    } catch (error) {
        console.error('Error fetching top products:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}