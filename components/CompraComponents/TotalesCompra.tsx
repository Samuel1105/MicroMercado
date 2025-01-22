// components/TotalesCompra.tsx
import React from 'react';

interface Totales {
    subtotal: number;
    descuentoTotal: number;
    total: number;
}

interface Props {
    totales: Totales;
}

export default function TotalesCompra({ totales }: Props) {
    return (
        <div className="mt-4 bg-white shadow-md rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                    <p className="text-gray-600">Subtotal</p>
                    <p className="text-xl font-semibold">
                        Bs. {typeof totales.subtotal === 'number' ? totales.subtotal.toFixed(2) : '0.00'}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-gray-600">Descuento Total</p>
                    <p className="text-xl font-semibold text-red-600">
                        Bs. {typeof totales.descuentoTotal === 'number' ? totales.descuentoTotal.toFixed(2) : '0.00'}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-gray-600">Total Final</p>
                    <p className="text-xl font-semibold text-green-600">
                        Bs. {typeof totales.total === 'number' ? totales.total.toFixed(2) : '0.00'}
                    </p>
                </div>
            </div>
        </div>
    );
}