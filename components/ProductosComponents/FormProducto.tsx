'use client'
import { Button, Checkbox, Input, Select, SelectItem, Textarea, Card, CardBody } from '@nextui-org/react'
import "@/app/globals.css";
import React, { useEffect, useState, useMemo } from 'react'
import axios from 'axios';
import { Categoria, Proveedor, UnidadMedida } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Package, FileText, PiggyBank, Tag, Truck, Ruler, Barcode, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import ModalRegistro from '../CategoriaComponents/ModalRegistro';
import ModalRegistroP from '../ProveedorComponents/ModalRegistroP';

export default function FormProducto() {
    const { user } = useAuth()
    const router = useRouter();
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
    const [searchProveedor, setSearchProveedor] = useState("");
    const [searchCategoria, setSearchCategoria] = useState("");
    
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precio: '',
        categoria: '',
        proveedor: '',
        unidad: 1,
        tieneCodigo: false
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [proveedoresRes, categoriasRes, unidadesRes] = await Promise.all([
                    axios.get("/Api/proveedores/"),
                    axios.get("/Api/categorias/"),
                    axios.get("/Api/unidadmedidas/")
                ]);

                setProveedores(proveedoresRes.data?.data || []);
                setCategorias(categoriasRes.data?.data || []);
                setUnidadesMedida(unidadesRes.data?.data || []);
            } catch (error) {
                console.error("Error fetching data:", error);
                showNotification('Error', 'No se pudo cargar la información necesaria', 'error');
            }
        };

        fetchData();
    }, []);

    const handleNewCategoria = (newCategoria: Categoria) => {
        setCategorias(prevCategorias => [...prevCategorias, newCategoria]);
    };

    const handleNewProveedor = (newProvededor: Proveedor) => {
        setProveedores(prevProveedores => [...prevProveedores, newProvededor]);
    };

    const filteredProveedores = useMemo(() => {
        return proveedores.filter((proveedor) =>
            proveedor.nombre.toLowerCase().includes(searchProveedor.toLowerCase())
        );
    }, [proveedores, searchProveedor]);

    const filteredCategorias = useMemo(() => {
        return categorias.filter((categoria) =>
            categoria.nombre.toLowerCase().includes(searchCategoria.toLowerCase())
        );
    }, [categorias, searchCategoria]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string) => (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [name]: e.target.value }));
    };

    const handleCheckboxChange = (isSelected: boolean) => {
        setFormData(prev => ({ ...prev, tieneCodigo: isSelected }));
    };

    const showNotification = (title: string, message: string, icon: 'success' | 'error' | 'warning') => {
        Swal.fire({
            title,
            text: message,
            icon,
            confirmButtonText: 'Cerrar'
        });
    };

    const clickSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            // Verificar si ya existe un producto con el mismo nombre, categoría y proveedor
            const checkResponse = await axios.get('/Api/producto/check', {
                params: {
                    nombre: formData.nombre,
                    categoriaId: formData.categoria,
                    proveedorId: formData.proveedor
                }
            });

            if (checkResponse.data.exists) {
                showNotification('Advertencia', 'Ya existe un producto con el mismo nombre, categoría y proveedor.', 'warning');
                return;
            }

            // Si no existe, proceder a crear el nuevo producto
            const response = await axios.post('/Api/producto/catalogo/', {
                ...formData,
                precio: parseFloat(formData.precio),
                usuario: user?.id,
                serie: formData.tieneCodigo ? 1 : 0
            });
            
            if (response.data && response.data.data) {
                showNotification('Éxito', 'Producto registrado exitosamente', 'success');
                router.push('/Productos/Catalogo');
            }
        } catch (error) {
            console.error(error);
            showNotification('Error', 'No se pudo registrar el producto', 'error');
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
            <Card className="w-full max-w-4xl">
                <CardBody className="p-8">
                    <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Agregar Producto al Catálogo</h2>
                    <form onSubmit={clickSubmit} className="space-y-4">
                        <Input
                            label="Nombre del producto"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            startContent={<Package className="text-gray-400" />}
                            required
                        />
                        <Textarea
                            label="Descripción"
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            startContent={<FileText className="text-gray-400" />}
                        />
                        <Input
                            type="number"
                            label="Precio del producto"
                            name="precio"
                            value={formData.precio}
                            onChange={handleChange}
                            startContent={<PiggyBank className="text-gray-400" />}
                            required
                        />
                        <div className="flex space-x-2">
                            <div className="flex-grow">
                                <Select
                                    label="Categoría"
                                    name="categoria"
                                    placeholder="Selecciona una categoría"
                                    onChange={handleSelectChange('categoria')}
                                    startContent={<Tag className="text-gray-400" />}
                                >
                                    {filteredCategorias.map((categoria) => (
                                        <SelectItem key={categoria.id} value={categoria.id.toString()}>
                                            {categoria.nombre}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                            <Input
                                aria-label="Buscar categoría"
                                placeholder="Buscar"
                                value={searchCategoria}
                                onChange={(e) => setSearchCategoria(e.target.value)}
                                startContent={<Search className="text-gray-400" />}
                                className="w-1/3"
                            />
                            <div className='w-full md:w-auto'>
                                <ModalRegistro onNewCategoria={handleNewCategoria} />
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <div className="flex-grow">
                                <Select
                                    label="Proveedor"
                                    name="proveedor"
                                    placeholder="Selecciona un proveedor"
                                    onChange={handleSelectChange('proveedor')}
                                    startContent={<Truck className="text-gray-400" />}
                                >
                                    {filteredProveedores.map((proveedor) => (
                                        <SelectItem key={proveedor.id} value={proveedor.id.toString()}>
                                            {proveedor.nombre}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                            <Input
                                aria-label="Buscar proveedor"
                                placeholder="Buscar"
                                value={searchProveedor}
                                onChange={(e) => setSearchProveedor(e.target.value)}
                                startContent={<Search className="text-gray-400" />}
                                className="w-1/3"
                            />
                            <div className='w-full md:w-auto'>
                                <ModalRegistroP onNewProveedor={handleNewProveedor} />
                            </div>
                        </div>
                        {/* <Select
                            label="Unidad de Medida"
                            name="unidadMedida"
                            placeholder="Selecciona una unidad de medida"
                            onChange={handleSelectChange('unidad')}
                            startContent={<Ruler className="text-gray-400" />}
                        >
                            {unidadesMedida.map((unidad) => (
                                <SelectItem key={unidad.id} value={unidad.id.toString()}>
                                    {unidad.nombre}
                                </SelectItem>
                            ))}
                        </Select> */}
                       
                        <Button type="submit" color="primary" className="mt-4 w-full">
                            Registrar producto
                        </Button>
                    </form>
                </CardBody>
            </Card>
        </div>
    );
}