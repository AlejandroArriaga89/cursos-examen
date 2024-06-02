import Link from "next/link"; // Importamos Link en lugar de useNavigation
import LoginForm from "../components/LoginForm.js";

const Login = () => {
  const handleLogin = async (email, password) => {
    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      // Verificar si la solicitud fue exitosa
      if (response.ok) {
        // Obtener la respuesta del servidor en formato JSON
        const data = await response.json();

        // Almacenar el token JWT en el localStorage
        localStorage.setItem("token", data.token);

        // Realizar otras acciones después de iniciar sesión exitosamente, como redirigir a una página diferente
      } else {
        // Manejar errores de inicio de sesión
        console.error("Error al iniciar sesión");
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  return (
    <>
      <h1 className="mt-5">Iniciar Sesión</h1>
      {/* <LoginForm onLogin={handleLogin} /> */}
      <LoginForm></LoginForm>
      <p>
        No tienes una cuenta?{" "}
        <Link href="/register">
          <label>Regístrate</label>
        </Link>
      </p>
    </>
  );
};

export default Login;
