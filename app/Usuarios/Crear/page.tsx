'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardBody, Input, Button, Select, SelectItem } from "@nextui-org/react"
import { User, Lock, Mail, Phone } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '@/app/context/AuthContext'
import Swal from 'sweetalert2'

export default function Page() {
    const { user } = useAuth()

    const [formData, setFormData] = useState({
        primerNombre: '',
        segundoNombre: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        correo: '',
        contraseña: '',
        celular: '',
        rol: '',
        usuarioid: 0
    })

    // Asignar el usuarioid cuando el usuario esté disponible
    useEffect(() => {
        if (user?.id) {
            setFormData((prevState) => ({
                ...prevState,
                usuarioid: user.id // Asignamos el ID del usuario autenticado
            }))
        }
    }, [user])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: value
        })
    }

    const handleSelectChange = (value: string) => {
        setFormData({
            ...formData,
            rol: value
        })
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
        e.preventDefault();
    
        try {
            const response = await axios.post('/Api/usuarios', {
                ...formData,
                celular: parseInt(formData.celular),
                rol: parseInt(formData.rol),
            });
    
            if (response.status === 200) {
                showNotification('Éxito', 'Usuario registrado exitosamente', 'success');
                setFormData({
                    primerNombre: '',
                    segundoNombre: '',
                    apellidoPaterno: '',
                    apellidoMaterno: '',
                    correo: '',
                    contraseña: '',
                    celular: '',
                    rol: '',
                    usuarioid: 0
                });
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                if (error.response.status === 400 && error.response.data.error === "DUPLICATE_EMAIL") {
                    showNotification(
                        'Error',
                        'Ya existe un usuario registrado con este correo electrónico',
                        'error'
                    );
                } else {
                    showNotification('Error', 'Error al registrar el usuario', 'error');
                }
            } else {
                console.error('Error:', error);
                showNotification('Error', 'Error en el servidor', 'error');
            }
        }
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
            <Card className="w-full max-w-md">
                <CardBody className="p-8">
                    <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Registro de Usuario</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Primer Nombre"
                            //placeholder="Juan"
                            name="primerNombre"
                            value={formData.primerNombre}
                            onChange={handleChange}
                            required
                            startContent={<User className="text-gray-400" />}
                        />
                        <Input
                            label="Segundo Nombre (opcional)"
                            //placeholder=" (opcional)"
                            name="segundoNombre"
                            value={formData.segundoNombre}
                            onChange={handleChange}
                            startContent={<User className="text-gray-400" />}
                        />
                        <Input
                            label="Apellido Paterno"
                            //placeholder="Pérez"
                            name="apellidoPaterno"
                            value={formData.apellidoPaterno}
                            onChange={handleChange}
                            required
                            startContent={<User className="text-gray-400" />}
                        />
                        <Input
                            label="Apellido Materno"
                            //placeholder="González"
                            name="apellidoMaterno"
                            value={formData.apellidoMaterno}
                            onChange={handleChange}
                            required
                            startContent={<User className="text-gray-400" />}
                        />
                        <Input
                            label="Correo Electrónico"
                            type="email"
                            //placeholder="ejemplo@correo.com"
                            name="correo"
                            value={formData.correo}
                            onChange={handleChange}
                            required
                            startContent={<Mail className="text-gray-400" />}
                        />
                        <Input
                            label="Contraseña"
                            type="password"
                            //placeholder="********"
                            name="contraseña"
                            value={formData.contraseña}
                            onChange={handleChange}
                            required
                            startContent={<Lock className="text-gray-400" />}
                        />
                        <Input
                            label="Teléfono Celular"
                            type="tel"
                            //placeholder="600123456"
                            name="celular"
                            value={formData.celular}
                            onChange={handleChange}
                            required
                            startContent={<Phone className="text-gray-400" />}
                        />
                        <Select
                            label="Rol"
                            placeholder="Selecciona un rol"
                            onChange={(e) => handleSelectChange(e.target.value)}
                            required
                        >
                            <SelectItem key="1" value="1">Administrador</SelectItem>
                            <SelectItem key="2" value="2">Cajero</SelectItem>
                            <SelectItem key="3" value="3">Almacen</SelectItem>
                            <SelectItem key="4" value="4">Reportes</SelectItem>
                            <SelectItem key="5" value="5">Compras</SelectItem>
                        </Select>
                        <Button type="submit" color="primary" fullWidth className="mt-4">
                            Registrarse
                        </Button>
                    </form>
                </CardBody>
            </Card>
        </div>
    )
}
