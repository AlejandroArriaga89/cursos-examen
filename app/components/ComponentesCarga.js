"use client";
// pages/cargar_materiales.js
import React, { useState, useEffect } from "react";
import CursosList from "../components/CursosList";
import { useRouter } from "next/navigation";

const ComponentesCarga = () => {
  const router = useRouter();

  const [cursos, setCursos] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No se encontró el token");
      return;
    }

    const fetchCursos = async () => {
      try {
        const response = await fetch("http://localhost:8000/cursos", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Error al obtener cursos");
        }
        const data = await response.json();
        setCursos(data);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchCursos();
  }, []);

  const handleSubmit = async (e) => {
    const formData = new FormData();
    formData.append("cursos", cursos);
    formData.append("archivo", archivo);
    try {
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        router.push("/");
      } else {
        console.error("Error al registrarse");
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  return (
    <div className="container mt-5">
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6">
            {error ? (
              <div className="alert alert-danger">{error}</div>
            ) : (
              <CursosList cursos={cursos} />
            )}
          </div>
          <div className="col-md-6">
            <h2>Subir Archivo</h2>
            <div className="form-group">
              <label htmlFor="archivo">Seleccionar Archivo:</label>
              <input
                required
                type="file"
                className="form-control-file"
                id="archivo"
                name="archivo"
                onChange={(e) => setArchivo(e.target.files[0])}
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <button type="submit" className="btn btn-primary form-group">
              Subir Archivo
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ComponentesCarga;
