import React, { useState } from 'react';
import { Producto } from '@/type/types';
import { Package, ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface Props {
  productos: Producto[];
  currentPage: number;
  totalProductos: number;
  onSelectProducto: (producto: Producto) => void;
  onPageChange: (page: number) => void;
}

const PAGE_SIZE = 10;

export default function ProductosDisponibles({ 
  productos, 
  currentPage, 
  totalProductos, 
  onSelectProducto, 
  onPageChange 
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredProductos = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(totalProductos / PAGE_SIZE));

  return (
    <div className="w-full lg:w-1/3">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <Package className="mr-2" />
        Productos
      </h2>
      
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-md pr-10"
          />
          <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProductos.length > 0 ? (
                filteredProductos.map((producto) => (
                  <tr
                    key={producto.id.toString()}
                    onClick={() => onSelectProducto(producto)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                  >
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {producto.nombre}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <div className="truncate max-w-xs" title={producto.descripcion}>
                        {producto.descripcion}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {producto.precioVenta} bs
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-gray-500">
                    No se encontraron productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center items-center space-x-2">
          <button
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="p-1 rounded-full bg-gray-200 disabled:opacity-50 hover:bg-gray-300 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          
          <span className="text-sm font-medium">
            Página {currentPage} de {totalPages}
          </span>
          
          <button
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1 rounded-full bg-gray-200 disabled:opacity-50 hover:bg-gray-300 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}