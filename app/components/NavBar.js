"use client";
// components/NavBar.js
import { useEffect, useState } from "react";
import Link from "next/link";

export default function NavBar({ token }) {
  // Remover la definición de NavBar dentro de otra función
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    // Verificar si hay un token JWT almacenado
    if (token) {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
    }
  }, [token]);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        <Link href="/" className="navbar-brand">
          Inicio
        </Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav mr-auto">
            <li className="nav-item">
              <Link href="/courses" className="nav-link">
                Cursos
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/participantes" className="nav-link">
                Participantes
              </Link>
            </li>

            <li className="nav-item">
              <Link href="/inscripciones" className="nav-link">
                Inscripciones
              </Link>
            </li>

            <li className="nav-item">
              <Link href="/upload" className="nav-link">
                Cargar Materiales
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
