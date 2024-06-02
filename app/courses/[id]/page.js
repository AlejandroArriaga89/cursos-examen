"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";

const CourseDetail = ({ params }) => {
  const [course, setCourse] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { id } = params;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No token found");
      return;
    }

    fetch(`http://localhost:8000/cursos/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch course");
        }
        return response.json();
      })
      .then((data) => setCourse(data))
      .catch((error) =>
        console.error("Error al obtener detalles del curso:", error)
      );
  }, [id]);

  const handleInscribir = async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      setError("No token or user ID found");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/inscribir", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, courseId: id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to enroll in course");
      }

      // Redirigir o actualizar la página después de inscribirse con éxito
      router.push("/courses");
    } catch (error) {
      setError(error.message);
    }
  };

  if (!course) return <div>Cargando...</div>;

  return (
    <div className="container mt-5">
      <h1 className="mb-4">{course.nombre}</h1>
      <p>
        <strong>Descripción:</strong> {course.descripcion}
      </p>
      <p>
        <strong>Duración:</strong> {course.duracion}
      </p>
      <p>
        <strong>Lugar:</strong> {course.lugar}
      </p>
      <p>
        <strong>Requerimientos Técnicos:</strong>{" "}
        {course.requerimientosTecnicos}
      </p>
      <p>
        <strong>Capacidad:</strong> {course.capacidad}
      </p>
      <p>
        <strong>Horario:</strong> {course.horario}
      </p>
      {error && <div className="alert alert-danger">{error}</div>}
      <button className="btn btn-primary" onClick={handleInscribir}>
        Inscribir
      </button>
      <button className="btn btn-secondary" onClick={() => router.back()}>
        Volver
      </button>
    </div>
  );
};

export default CourseDetail;
