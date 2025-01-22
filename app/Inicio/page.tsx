'use client'
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, CardHeader, Spinner } from "@nextui-org/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

// Tipos para nuestros datos
type MonthlyData = {
  month: string;
  compras: number;
  ventas: number;
};

type DailyData = {
  date: string;
  ventas: number;
};

type TopProducts = {
  name: string;
  quantity: number;
};

// Funciones para obtener datos de la API
async function getMonthlyData(): Promise<MonthlyData[]> {
  const response = await fetch('/Api/dashboard/monthly-data');
  if (!response.ok) {
    throw new Error('Failed to fetch monthly data');
  }
  const data = await response.json();
  return data.data.map((item: MonthlyData) => ({
    ...item,
    compras: Number(item.compras.toFixed(2)),
    ventas: Number(item.ventas.toFixed(2))
  }));
}

async function getDailyData(): Promise<DailyData[]> {
  const response = await fetch('/Api/dashboard/daily-data');
  if (!response.ok) {
    throw new Error('Failed to fetch daily data');
  }
  const data = await response.json();
  return data.data.map((item: DailyData) => ({
    ...item,
    ventas: Number(item.ventas.toFixed(2))
  }));
}

async function getTopProducts(): Promise<TopProducts[]> {
  const response = await fetch('/Api/dashboard/top-products');
  if (!response.ok) {
    throw new Error('Failed to fetch top products');
  }
  const data = await response.json();
  return data.data;
}

// Función para formatear la moneda
const formatCurrency = (value: number) => {
  return `Bs ${value.toFixed(2)}`;
};

export default function InicioPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProducts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/');
    } else {
      const fetchData = async () => {
        try {
          const [monthly, daily, top] = await Promise.all([
            getMonthlyData(),
            getDailyData(),
            getTopProducts(),
          ]);
          setMonthlyData(monthly);
          setDailyData(daily);
          setTopProducts(top);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner label="Cargando..." />
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-8">
          <CardHeader className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Bienvenido, {user?.primerNombre} {user?.apellidoPaterno}</h1>
            <Button color="primary" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </CardHeader>
          <CardBody>
            <p className="text-lg"><strong>Correo:</strong> {user?.correo}</p>
            <p className="text-lg"><strong>Rol:</strong> {user?.rol}</p>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">Compras y Ventas Mensuales</h2>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="compras" fill="#8884d8" name="Compras" />
                  <Bar dataKey="ventas" fill="#82ca9d" name="Ventas" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">Ventas Diarias (Últimos 30 días)</h2>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="ventas" stroke="#8884d8" name="Ventas" />
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">Productos Más Vendidos</h2>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantity" fill="#82ca9d" name="Cantidad Vendida" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}