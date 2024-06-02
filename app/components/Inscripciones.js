"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";

const Inscripciones = () => {
  const [inscripciones, setInscripciones] = useState([]);
  const [error, setError] = useState(null);
  const router = useRouter();
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token || !userId) {
      setError("No token or user ID found");
      return;
    }

    fetch(`http://localhost:8000/inscripciones/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch inscriptions");
        }
        return response.json();
      })
      .then((data) => setInscripciones(data))
      .catch((error) => setError(error.message));
  }, [userId, token]);

  const handleDelete = async (inscripcionId, courseId) => {
    try {
      const response = await fetch(
        `http://localhost:8000/inscripciones/${inscripcionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete inscription");
      }
      setInscripciones(
        inscripciones.filter((inscripcion) => inscripcion._id !== inscripcionId)
      );
      alert("Inscripción cancelada exitosamente");
    } catch (error) {
      console.error("Error:", error.message);
    }
  };

  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Mis Inscripciones</h1>
      {inscripciones.length === 0 ? (
        <div>No estás inscrito en ningún curso.</div>
      ) : (
        <ul className="list-group">
          {inscripciones.map((inscripcion) => (
            <li key={inscripcion.courseId._id} className="list-group-item">
              <h5>{inscripcion.courseId.nombre}</h5>
              <p>{inscripcion.courseId.descripcion}</p>
              <p>
                <strong>Duración:</strong> {inscripcion.courseId.duracion}
              </p>
              <p>
                <strong>Lugar:</strong> {inscripcion.courseId.lugar}
              </p>
              <p>
                <strong>Horario:</strong> {inscripcion.courseId.horario}
              </p>
              <button
                className="btn btn-danger"
                onClick={() =>
                  handleDelete(inscripcion._id, inscripcion.courseId._id)
                }
              >
                Cancelar Inscripción
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        className="btn btn-secondary mt-3"
        onClick={() => router.push("/")}
      >
        Volver
      </button>
    </div>
  );
};

export default Inscripciones;
