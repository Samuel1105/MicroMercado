'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { Card, CardBody, Input, Button, Select, SelectItem, Spinner } from "@nextui-org/react"
import { Skeleton } from "@nextui-org/skeleton"
import { User, Lock, Mail, Phone } from 'lucide-react'
import axios from 'axios'
import { useSearchParams } from 'next/navigation'
import Swal from 'sweetalert2'
import { useAuth } from '@/app/context/AuthContext'

export default function EditUserPage() {
   return (
       <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Spinner label="Cargando..." /></div>}>
           <EditUserContent />
       </Suspense>
   )
}

function EditUserContent() {
   const { user } = useAuth()
   const searchParams = useSearchParams()
   const id = searchParams.get('id')

   const [formData, setFormData] = useState({
       primerNombre: '',
       segundoNombre: '',
       apellidoPaterno: '',
       apellidoMaterno: '',
       correo: '',
       celular: '',
       rol: '',
       usuarioid: 0
   })

   const [loading, setLoading] = useState(true)

   useEffect(() => {
       if (id) {
           fetchUserData(id)
       }
   }, [id])

   const fetchUserData = async (userId: string) => {
       try {
           const response = await axios.get(`/Api/usuarios/${userId}`)
           if (response.status === 200) {
               console.log("Datos recibidos:", response.data.data.rol)
               const userData = response.data.data
               setFormData({
                   ...userData,
                   celular: userData.celular.toString(),
                   rol: userData.rol.toString()
               })
           }
       } catch (error) {
           console.error('Error fetching user data:', error)
           showNotification('Error', 'No se pudo cargar los datos del usuario', 'error')
       } finally {
           setLoading(false)
       }
   }

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       const { name, value } = e.target
       setFormData(prevState => ({
           ...prevState,
           [name]: value
       }))
   }

   const handleSelectChange = (value: string) => {
       console.log("Rol seleccionado:", value)
       setFormData(prevState => ({
           ...prevState,
           rol: value
       }))
   }

   const showNotification = (title: string, message: string, icon: 'success' | 'error') => {
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
           const response = await axios.put(`/Api/usuarios/${id}`, {
               ...formData,
               celular: parseInt(formData.celular),
               rol: parseInt(formData.rol),
               usuarioid: user?.id
           })
           
           if (response.status === 200) {
               showNotification('Éxito', 'Usuario actualizado exitosamente', 'success')
           }
       } catch (error) {
           if (axios.isAxiosError(error) && error.response) {
               if (error.response.status === 400 && error.response.data.error === "DUPLICATE_EMAIL") {
                   showNotification(
                       'Error',
                       'Ya existe otro usuario registrado con este correo electrónico',
                       'error'
                   )
               } else {
                   showNotification('Error', 'Error al actualizar el usuario', 'error')
               }
           } else {
               console.error('Error:', error)
               showNotification('Error', 'Error en el servidor', 'error')
           }
       }
   }

   return (
       <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
           <Card className="w-full max-w-md">
               <CardBody className="p-8">
                   <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Editar Usuario</h2>
                   <form onSubmit={handleSubmit} className="space-y-4">
                       <Skeleton isLoaded={!loading} className="rounded-lg">
                           <Input
                               label="Primer Nombre"
                               placeholder="Juan"
                               name="primerNombre"
                               value={formData.primerNombre}
                               onChange={handleChange}
                               required
                               startContent={<User className="text-gray-400" />}
                           />
                       </Skeleton>
                       <Skeleton isLoaded={!loading} className="rounded-lg">
                           <Input
                               label="Segundo Nombre"
                               placeholder="Carlos (opcional)"
                               name="segundoNombre"
                               value={formData.segundoNombre}
                               onChange={handleChange}
                               startContent={<User className="text-gray-400" />}
                           />
                       </Skeleton>
                       <Skeleton isLoaded={!loading} className="rounded-lg">
                           <Input
                               label="Apellido Paterno"
                               placeholder="Pérez"
                               name="apellidoPaterno"
                               value={formData.apellidoPaterno}
                               onChange={handleChange}
                               required
                               startContent={<User className="text-gray-400" />}
                           />
                       </Skeleton>
                       <Skeleton isLoaded={!loading} className="rounded-lg">
                           <Input
                               label="Apellido Materno"
                               placeholder="González"
                               name="apellidoMaterno"
                               value={formData.apellidoMaterno}
                               onChange={handleChange}
                               required
                               startContent={<User className="text-gray-400" />}
                           />
                       </Skeleton>
                       <Skeleton isLoaded={!loading} className="rounded-lg">
                           <Input
                               label="Correo Electrónico"
                               type="email"
                               placeholder="ejemplo@correo.com"
                               name="correo"
                               value={formData.correo}
                               onChange={handleChange}
                               required
                               startContent={<Mail className="text-gray-400" />}
                           />
                       </Skeleton>
                       <Skeleton isLoaded={!loading} className="rounded-lg">
                           <Input
                               label="Teléfono Celular"
                               type="tel"
                               placeholder="600123456"
                               name="celular"
                               value={formData.celular}
                               onChange={handleChange}
                               required
                               startContent={<Phone className="text-gray-400" />}
                           />
                       </Skeleton>
                       <Skeleton isLoaded={!loading} className="rounded-lg">
                           <Select
                               label="Rol"
                               placeholder="Selecciona un rol"
                               selectedKeys={formData.rol ? [formData.rol] : []}
                               onChange={(e) => handleSelectChange(e.target.value)}
                               required
                           >
                               <SelectItem key="1">Administrador</SelectItem>
                               <SelectItem key="2">Cajero</SelectItem>
                               <SelectItem key="3">Almacen</SelectItem>
                               <SelectItem key="4">Reportes</SelectItem>
                               <SelectItem key="5">Compras</SelectItem>
                           </Select>
                       </Skeleton>

                       <Button type="submit" color="primary" fullWidth className="mt-4">
                           Actualizar Usuario
                       </Button>
                   </form>
               </CardBody>
           </Card>
       </div>
   )
}

export const dynamic = 'force-dynamic'