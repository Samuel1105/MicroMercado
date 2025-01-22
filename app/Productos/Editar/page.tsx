'use client'
import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import { Card, CardBody, Input, Textarea, Select, SelectItem, Button, Spinner } from "@nextui-org/react"
import { Package, FileText, Tag, Truck } from 'lucide-react'
import Swal from 'sweetalert2'
import { useAuth } from '@/app/context/AuthContext'

export default function EditProductPage() {
   return (
       <Suspense fallback={<div className="flex justify-center items-center h-screen">
           <Spinner label="Cargando..." />
       </div>}>
           <EditProductContent />
       </Suspense>
   )
}

function EditProductContent() {
   const valor = useSearchParams();
   const id = valor.get('id');
   const { user } = useAuth();
   const [product, setProduct] = useState<any>(null)
   const [loading, setLoading] = useState(true)
   const [categorias, setCategorias] = useState<any[]>([])
   const [proveedores, setProveedores] = useState<any[]>([])
   const router = useRouter()
   
   useEffect(() => {
       const fetchData = async () => {
           try {
               const [productRes, categoriasRes, proveedoresRes] = await Promise.all([
                   axios.get(`/Api/producto/${id}`),
                   axios.get("/Api/categorias/"),
                   axios.get("/Api/proveedores/")
               ])
               setProduct(productRes.data.data)
               setCategorias(categoriasRes.data.data || [])
               setProveedores(proveedoresRes.data.data || [])
           } catch (error) {
               console.error("Error fetching data:", error)
               showNotification('Error', 'No se pudo cargar la información del producto', 'error')
           } finally {
               setLoading(false)
           }
       }
       if (id) {
           fetchData()
       }
   }, [id])

   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
       const { name, value } = e.target
       setProduct({ ...product, [name]: value })
   }

   const handleSelectChange = (name: string) => (e: React.ChangeEvent<HTMLSelectElement>) => {
       setProduct({ ...product, [name]: e.target.value })
   }

   const showNotification = (title: string, message: string, icon: 'success' | 'error' | 'warning') => {
       Swal.fire({
           title,
           text: message,
           icon,
           confirmButtonText: 'Cerrar'
       })
   }

   const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault()
       try {
           const response = await axios.put(`/Api/producto/${id}`, {
               nombre: product.nombre,
               descripcion: product.descripcion,
               categoriaID: parseInt(product.categoriaID),
               proveedorID: parseInt(product.proveedorID),
               usuarioId: user?.id
           })
           if (response.data && response.data.data) {
               showNotification('Éxito', 'Producto actualizado exitosamente', 'success')
               router.push('/Productos/Catalogo')
           }
       } catch (error) {
           console.error("Error updating product:", error)
           showNotification('Error', 'No se pudo actualizar el producto', 'error')
       }
   }

   if (loading) {
       return (
           <div className="flex justify-center items-center h-screen">
               <Spinner label="Cargando producto..." />
           </div>
       )
   }

   if (!product) {
       return <div>Producto no encontrado</div>
   }

   return (
       <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
           <Card className="w-full max-w-2xl">
               <CardBody className="p-8">
                   <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Editar Producto</h2>
                   <form onSubmit={handleSubmit} className="space-y-4">
                       <Input
                           label="Nombre del producto"
                           name="nombre"
                           value={product.nombre}
                           onChange={handleChange}
                           startContent={<Package className="text-gray-400" />}
                           required
                       />
                       <Textarea
                           label="Descripción"
                           name="descripcion"
                           value={product.descripcion}
                           onChange={handleChange}
                           startContent={<FileText className="text-gray-400" />}
                       />
                       <Select
                           label="Categoría"
                           name="categoriaID"
                           selectedKeys={[product.categoriaID.toString()]}
                           onChange={handleSelectChange('categoriaID')}
                           startContent={<Tag className="text-gray-400" />}
                       >
                           {categorias.map((categoria) => (
                               <SelectItem key={categoria.id.toString()} value={categoria.id.toString()}>
                                   {categoria.nombre}
                               </SelectItem>
                           ))}
                       </Select>
                       <Select
                           label="Proveedor"
                           name="proveedorID"
                           selectedKeys={[product.proveedorID.toString()]}
                           onChange={handleSelectChange('proveedorID')}
                           startContent={<Truck className="text-gray-400" />}
                       >
                           {proveedores.map((proveedor) => (
                               <SelectItem key={proveedor.id.toString()} value={proveedor.id.toString()}>
                                   {proveedor.nombre}
                               </SelectItem>
                           ))}
                       </Select>
                       <Button type="submit" color="primary" className="mt-4 w-full">
                           Actualizar producto
                       </Button>
                   </form>
               </CardBody>
           </Card>
       </div>
   )
}

export const dynamic = 'force-dynamic'