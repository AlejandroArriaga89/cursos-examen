"use client";
import React, { useState, useEffect } from "react";

const ParticipantesList = () => {
  const [participantes, setParticipantes] = useState([]);

  useEffect(() => {
    const fetchParticipantes = async () => {
      try {
        const response = await fetch("http://localhost:8000/participantes");
        if (!response.ok) {
          throw new Error("Error al obtener participantes");
        }
        const data = await response.json();
        setParticipantes(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchParticipantes();
  }, []);

  const handleDelete = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:8000/participantes/${id}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error("Error al eliminar participante");
      }
      setParticipantes(
        participantes.filter((participante) => participante._id !== id)
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Lista de Participantes</h2>
      <ul className="list-group">
        {participantes.map((participante) => (
          <li key={participante._id} className="list-group-item">
            <p>Nombre: {participante.nombre}</p>
            <p>Email: {participante.email}</p>
            <p>Dirección: {participante.direccion}</p>
            <p>Teléfono: {participante.telefono}</p>
            <button
              className="btn btn-danger"
              onClick={() => handleDelete(participante._id)}
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ParticipantesList;
