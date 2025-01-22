import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@nextui-org/react";

// Definición de la interfaz para el objeto de compra
interface Compra {
  id: number;
  cantidadMayor: number;
  unidadesPorMayor: number;
  cantidadIndividual: number;
  Producto: {
    nombre: string
  };
}

const ComprasTable: React.FC = () => {
  const [compras, setCompras] = useState<Compra[]>([]);

  useEffect(() => {
    const fetchCompras = async () => {
      try {
        const response = await fetch('/Api/detallescompras');
        const data = await response.json();
        if (response.ok) {
          setCompras(data.data);
        } else {
          console.error('Error fetching data:', data);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchCompras();
  }, []);

  const calculateTotalUnidades = (compra: Compra): number => {
    if (compra.cantidadMayor > 0) {
      return compra.unidadesPorMayor * compra.cantidadMayor;
    } else {
      return compra.cantidadIndividual;
    }
  };

  return (
    <Table aria-label="Tabla de Detalles de Compras">
      <TableHeader>
        <TableColumn>NOMBRE DEL PRODUCTO</TableColumn>
        <TableColumn>CANTIDAD</TableColumn>
        <TableColumn>TOTAL UNIDADES</TableColumn>
      </TableHeader>
      <TableBody>
        {compras.map((compra) => (
          <TableRow key={compra.id}>
            <TableCell>{compra.Producto.nombre}</TableCell>
            <TableCell>
              {compra.cantidadMayor > 0
                ? `${compra.cantidadMayor} (mayor)`
                : compra.cantidadIndividual}
            </TableCell>
            <TableCell>{calculateTotalUnidades(compra)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ComprasTable;