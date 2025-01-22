'use client'
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
  Button,
  Checkbox,
  CircularProgress,
} from "@nextui-org/react";
import axios from "axios";
import { useState, FormEvent } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/app/context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await axios.post('/Api/login', {
        correo: email.toUpperCase(),
        contraseña: password,
      });

      if (response.status === 200) {
        console.log("Login successful!");
        login(response.data.data); // This will now set the user data in a cookie
        router.push('/Inicio');
      } else {
        console.error("Login failed!", response.data);
        // Handle login failure (e.g., show error message)
      } 
    } catch (error) {
      console.error("Error during login:", error);
      // Handle error (e.g., show error message)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col md:flex-row items-center justify-center p-4 bg-zinc-100">
      <Card className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg md:mr-8">
        <CardHeader className="flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-2">Login</h2>
        </CardHeader>
        <Divider />
        <CardBody as="form" onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
              Correo Electronico
            </label>
            <Input
              id="email"
              type="email"
              fullWidth
              size="lg"
              placeholder="you@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
              Contraseña
            </label>
            <Input
              id="password"
              type="password"
              fullWidth
              size="lg"
              placeholder="Ingresar 6 caracteres o mas"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex items-center mb-4">
            <Checkbox
              id="remember"
              color="primary"
              size="md"
              checked
              className="mr-2"
            >
              Recordarme
            </Checkbox>
          </div>
          <Button
            type="submit"
            fullWidth
            color="primary"
            className="w-full bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            disabled={isLoading}
          >
            LOGIN
          </Button>
          {isLoading && (
            <div className="flex justify-center mt-4">
              <CircularProgress aria-label="Loading..." />
            </div>
          )}
        </CardBody>
      </Card>
      <div className="hidden md:block">
        <img src="/Image/logo.png" width={500} height={400} alt="Illustration" />
      </div>
    </main>
  );
}