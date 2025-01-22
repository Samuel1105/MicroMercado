// app/api/unidadmedidas/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const unidadesMedida = await prisma.unidadMedida.findMany();

        if (unidadesMedida.length > 0) {
            return NextResponse.json({ data: unidadesMedida }, { status: 200 });
        } else {
            return NextResponse.json({ data: "No hay unidades de medida registradas" }, { status: 404 });
        }
    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}