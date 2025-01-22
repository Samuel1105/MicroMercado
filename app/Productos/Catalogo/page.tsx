'use client'
import React, { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Pagination, Button, Modal, ModalContent, ModalHeader, ModalBody, Input, Select, SelectItem, Badge, Card, CardBody } from "@nextui-org/react";
import { Search, AlertTriangle, PackageOpen, Package } from "lucide-react";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import routes from '@/hooks/routes';
import Swal from 'sweetalert2';
import { Selection } from "@nextui-org/react";

interface Categoria {
  id: number;
  nombre: string;
}

interface Lote {
  id: number;
  numeroLote: string;
  fechaVencimiento: string;
  cantidadInicial: number;
  cantidadActual: number;
  detalleCompraID: number;
  estado: number;
  fechaRegistro?: string;
  usuarioRegistro?: number;
}

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  stock: number;
  Categoria: {
    id: number;
    nombre: string;
  };
  Proveedor: {
    nombre: string;
  };
  UnidadMedida: {
    nombre: string;
  };
  DetalleCompras?: {
    id: number;
    estado: number;
    Lote: Lote[];
  }[];
  alertas?: {
    sinStock: boolean;
    stockBajo: boolean;
    lotesPorVencer: number;
  };
}

interface LoteInfo {
  productoId: number;
  productoNombre: string;
  lotes: Lote[];
}

const PAGE_SIZE = 10;
const STOCK_MINIMO = 10;

export default function ProductosTable() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<LoteInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<Selection>(new Set(['all']));
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [stockFilter, setStockFilter] = useState<Selection>(new Set(['all']));
  const router = useRouter();

  const fetchCategorias = async () => {
    try {
      const response = await axios.get('/Api/categorias');
      setCategorias(response.data.data);
    } catch (error) {
      console.error("Error fetching categorias:", error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar las categorías',
        icon: 'error'
      });
    }
  };

  const fetchProductos = async (
    page: number,
    categoria?: string,
    stockFilterValue?: string
  ) => {
    setIsLoading(true);
    try {
      const selectedCategoriaValue = categoria || Array.from(selectedCategoria)[0];
      const selectedStockFilter = stockFilterValue || Array.from(stockFilter)[0];

      const response = await axios.get(`/Api/producto/catalogo`, {
        params: {
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          search: searchTerm,
          categoria: selectedCategoriaValue !== 'all' ? selectedCategoriaValue : undefined,
          stockFilter: selectedStockFilter
        }
      });
      setProductos(response.data.data);
      setTotalPages(Math.ceil(response.data.total / PAGE_SIZE));
    } catch (error) {
      console.error("Error fetching products:", error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar los productos',
        icon: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoriaChange = (e: Selection) => {
    setSelectedCategoria(e);
    setCurrentPage(1);
    const selectedValue = Array.from(e)[0] as string;
    fetchProductos(1, selectedValue);
  };

  const handleStockFilterChange = (e: Selection) => {
    setStockFilter(e);
    setCurrentPage(1);
    const selectedValue = Array.from(e)[0] as string;
    fetchProductos(1, undefined, selectedValue);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchProductos(page);
  };

  const fetchLoteInfo = async (productoId: number) => {
    try {
      const producto = productos.find(p => p.id === productoId);
      if (!producto) return;

      const lotesActivos = producto.DetalleCompras?.flatMap(dc =>
        dc.Lote.filter(lote => lote.estado === 1)
      ) || [];

      setSelectedProduct({
        productoId,
        productoNombre: producto.nombre,
        lotes: lotesActivos.map(lote => ({
          ...lote,
          cantidadActual: lote.cantidadInicial - (
            // Aquí calcularíamos la cantidad usada basada en movimientos
            0
          )
        }))
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching lot information:", error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo cargar la información de los lotes',
        icon: 'error'
      });
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  useEffect(() => {
    fetchProductos(currentPage);
  }, [currentPage, searchTerm]);

  const stockAlerts = {
    outOfStock: productos.filter(p => p.stock === 0).length,
    lowStock: productos.filter(p => p.stock > 0 && p.stock <= STOCK_MINIMO).length,
    totalLotesPorVencer: productos.reduce((sum, p) => sum + (p.alertas?.lotesPorVencer || 0), 0)
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lista de Productos</h1>
        <Button
          onClick={() => router.push(routes.products.add)}
          className="bg-primary text-white"
        >
          Crear Producto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-red-50">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-2 bg-red-100 rounded">
              <Package className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-red-600">Sin Stock</p>
              <p className="text-2xl font-bold text-red-700">{stockAlerts.outOfStock}</p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-yellow-50">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-2 bg-yellow-100 rounded">
              <AlertTriangle className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-yellow-600">Stock Bajo</p>
              <p className="text-2xl font-bold text-yellow-700">{stockAlerts.lowStock}</p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-blue-50">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-2 bg-blue-100 rounded">
              <PackageOpen className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-blue-600">Lotes por Vencer</p>
              <p className="text-2xl font-bold text-blue-700">{stockAlerts.totalLotesPorVencer}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          startContent={<Search size={18} />}
          className="md:w-1/3"
        />

        <Select
          label="Filtrar por categoría"
          selectedKeys={selectedCategoria}
          onSelectionChange={handleCategoriaChange}
          className="md:w-1/4"
        >
          {[
            <SelectItem key="all" value="all">
              Todas las categorías
            </SelectItem>
          ].concat(
            categorias.map((cat) => (
              <SelectItem key={cat.id.toString()} value={cat.id.toString()}>
                {cat.nombre}
              </SelectItem>
            ))
          )}
        </Select>

        <Select
          label="Filtrar por stock"
          selectedKeys={stockFilter}
          onSelectionChange={handleStockFilterChange}
          className="md:w-1/4"
        >
          <SelectItem key="all" value="all">Todo el stock</SelectItem>
          <SelectItem key="low" value="low">Stock bajo</SelectItem>
          <SelectItem key="out" value="out">Sin stock</SelectItem>
        </Select>
      </div>

      <Table
        aria-label="Tabla de productos"
        className="min-w-full"
        isHeaderSticky
      >
        <TableHeader>
          <TableColumn>NOMBRE</TableColumn>
          <TableColumn>DESCRIPCIÓN</TableColumn>
          <TableColumn>CATEGORÍA</TableColumn>
          <TableColumn>PROVEEDOR</TableColumn>
          <TableColumn>STOCK</TableColumn>
          <TableColumn>ACCIONES</TableColumn>
        </TableHeader>
        <TableBody
          isLoading={isLoading}
          emptyContent={isLoading ? "Cargando..." : "No hay productos disponibles"}
        >
          {productos.map((producto) => (
            <TableRow key={producto.id}>
              <TableCell>{producto.nombre}</TableCell>
              <TableCell>{producto.descripcion}</TableCell>
              <TableCell>{producto.Categoria.nombre}</TableCell>
              <TableCell>{producto.Proveedor.nombre}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {producto.stock}
                  {producto.stock === 0 ? (
                    <Badge color="danger">Sin Stock</Badge>
                  ) : producto.stock <= STOCK_MINIMO ? (
                    <Badge color="warning">Stock Bajo</Badge>
                  ) : null}
                  {producto.alertas?.lotesPorVencer ? (
                    <Badge color="warning">{producto.alertas.lotesPorVencer} lotes por vencer</Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-secondary text-white"
                    onClick={() => fetchLoteInfo(producto.id)}
                  >
                    Ver Lotes
                  </Button>
                  <Button
                    size="sm"
                    className="bg-primary text-white"
                    onClick={() => router.push(`/Productos/Editar?id=${producto.id}`)}
                  >
                    Editar
                  </Button>
                </div>
              </TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-center mt-4">
        <Pagination
          total={totalPages}
          page={currentPage}
          onChange={handlePageChange}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-bold">
              Información de Lotes - {selectedProduct?.productoNombre}
            </h3>
          </ModalHeader>
          <ModalBody>
            {selectedProduct?.lotes && selectedProduct.lotes.length > 0 ? (
              <Table aria-label="Tabla de lotes">
                <TableHeader>
                  <TableColumn>NÚMERO DE LOTE</TableColumn>
                  <TableColumn>CANTIDAD INICIAL</TableColumn>
                  <TableColumn>CANTIDAD ACTUAL</TableColumn>
                  <TableColumn>FECHA VENCIMIENTO</TableColumn>
                  <TableColumn>ESTADO</TableColumn>
                </TableHeader>
                <TableBody>
                  {selectedProduct.lotes.map((lote) => {
                    const vencimiento = new Date(lote.fechaVencimiento);
                    const diasParaVencer = Math.ceil(
                      (vencimiento.getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                    );

                    return (
                      <TableRow key={lote.id}>
                        <TableCell>{lote.numeroLote}</TableCell>
                        <TableCell>{lote.cantidadInicial}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {lote.cantidadActual}
                            {lote.cantidadActual === 0 ? (
                              <Badge color="danger">Agotado</Badge>
                            ) : lote.cantidadActual <= STOCK_MINIMO ? (
                              <Badge color="warning">Bajo</Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {vencimiento.toLocaleDateString()}
                            {diasParaVencer <= 0 ? (
                              <Badge color="danger">Vencido</Badge>
                            ) : diasParaVencer <= 30 ? (
                              <Badge color="warning">Por vencer</Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge color={lote.estado === 1 ? "success" : "danger"}>
                            {lote.estado === 1 ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-4">No hay lotes disponibles para este producto</p>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}