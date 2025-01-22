'use client'
import { Button, Input, Select, SelectItem, Textarea } from '@nextui-org/react'
import "@/app/globals.css";
import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { Categoria, Proveedor } from '@prisma/client';
import ModalRegistro from '../CategoriaComponents/ModalRegistro';
import ModalRegistroP from '../ProveedorComponents/ModalRegistroP';
import { useRouter } from 'next/navigation';

export default function FromProductoEdit() {
    //navegacion
    const router = useRouter();
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [categoriaInput, setCategoriaInput] = useState('');
    const [proveedorInput, setProveedorInput] = useState('');

    //Variables de envio
    const [nombre , setNombre] = useState("");
    const [descripcion , setDescripcion] = useState("");
    const [precio, setPrecio] = useState("");
    
    const [idCategoria , setIdCategoria] = useState('');
    const [idProveedor , setIdProveedor] = useState('');

    useEffect(() => {
        axios.get("/Api/proveedores/").then((response) => {
            if (response.data && response.data.data) {
                setProveedores(response.data.data);
            }
        });

        axios.get("/Api/categorias/").then((response) => {
            if (response.data && response.data.data) {
                setCategorias(response.data.data);
            }
        });
    }, []);

    const filteredCategorias = categorias.filter(categoria =>
        categoria.nombre.toLowerCase().startsWith(categoriaInput.toLowerCase())
    );

    const filteredProveedores = proveedores.filter(proveedor =>
        proveedor.nombre.toLowerCase().startsWith(proveedorInput.toLowerCase())
    );

    const handleNewCategoria = (newCategoria: Categoria) => {
        setCategorias(prevCategorias => [...prevCategorias, newCategoria]);
    };

    const handleNewProveedor = (newProvededor: Proveedor) => {
        setProveedores(prevProveedores => [...prevProveedores, newProvededor]);
    };

    const selectCategoria = (e:React.ChangeEvent<HTMLSelectElement> ) =>{
        setIdCategoria(e.target.value)
    }
    const selectProveedor = (e:React.ChangeEvent<HTMLSelectElement>) =>{
        setIdProveedor(e.target.value)
    }
    const clickSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
       
        try {
            const response = await axios.post('/Api/producto/catalogo/' , {
                nombre: nombre,
                descripcion: descripcion,
                precio: precio,
                categoria: idCategoria,
                proveedor: idProveedor
    
            })
            
            if(response.data && response.data.data){
                 router.push('/Productos/Catalogo')
            }
        } catch (error) {
            console.log(error)
        }
        

        console.log(nombre  , descripcion , precio , idCategoria , idProveedor)
    };

    return (
        <>
            <div className='h-full p-6'>
                <h2 className='text-2xl font-bold mb-6 text-center'>Agregar Producto al Catálogo</h2>
                <form onSubmit={clickSubmit} className="space-y-6 pl-5 pr-5">
                    <div className='mb-4 flex flex-col md:flex-row'>
                        <Input
                            type='text'
                            id='nombre'
                            name='nombre'
                            label="Nombre del producto"
                            variant="bordered"
                            isInvalid={false}
                            errorMessage="Por favor, introduzca un nombre de producto"
                            onChange={(e) => setNombre(e.target.value)}
                            className='w-full '
                        />
                    </div>
                    <div className='mb-4'>
                        <Textarea
                            label="Descripción"
                            id='descripcion'
                            name='descripcion'
                            variant="bordered"
                            onChange={(e) => setDescripcion(e.target.value)}
                            className='w-full'
                        />
                    </div>
                    <div className='mb-4 flex flex-col md:flex-row md:space-x-4'>
                        <Input
                            type='number'
                            id='precio'
                            name='precio'
                            label="Precio del producto"
                            variant="bordered"
                            onChange={(e) => setPrecio(e.target.value)}
                            className='w-full '
                        />
                    </div>
                    <div className='mb-4 flex flex-col md:flex-row md:items-center md:space-x-4'>
                        <div className='w-full md:w-1/3'>
                            <Input
                                type='text'
                                id='categoriaInput'
                                name='categoriaInput'
                                label="Buscar categoría"
                                variant="bordered"
                                value={categoriaInput}
                                onChange={(e) => setCategoriaInput(e.target.value)}
                                className='pb-3'
                            />
                        </div>
                        <div className='w-full md:w-2/3 '>
                            <Select
                                label='Categoría'
                                variant='bordered'
                                placeholder="Selecciona una categoría"
                                onChange={selectCategoria}
                                className='w-full pb-3'
                            >
                                {filteredCategorias.map((categoria) => (
                                    <SelectItem key={categoria.id} value={categoria.nombre}>
                                        {categoria.nombre}
                                    </SelectItem>
                                ))}
                            </Select>
                        </div>
                        <div className='w-full md:w-auto'>
                            <ModalRegistro onNewCategoria={handleNewCategoria} />
                        </div>
                    </div>
                    <div className='mb-4 flex flex-col md:flex-row md:items-center md:space-x-4'>
                        <div className='w-full md:w-1/3'>
                            <Input
                                type='text'
                                id='proveedorInput'
                                name='proveedorInput'
                                label="Buscar proveedor"
                                variant="bordered"
                                value={proveedorInput}
                                onChange={(e) => setProveedorInput(e.target.value)}
                                className='pb-3'
                            />
                        </div>
                        <div className='w-full md:w-2/3'>
                            <Select
                                label='Proveedor'
                                variant='bordered'
                                placeholder='Seleccionar un proveedor'
                                onChange={selectProveedor}
                                className='w-full pb-3'
                            >
                                {filteredProveedores.map((proveedor) => (
                                    <SelectItem key={proveedor.id} value={proveedor.nombre}>
                                        {proveedor.nombre}
                                    </SelectItem>
                                ))}
                            </Select>
                        </div>
                        <div className='w-full md:w-auto'>
                            <ModalRegistroP onNewProveedor={handleNewProveedor} />
                        </div>
                    </div>
                    <div className='text-center'>
                        <Button type='submit' className='mb-4' color='primary'>
                            Registrar producto
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
