"use client";
// components/CursosList.js
import React from "react";

const CursosList = ({ cursos }) => {
  return (
    <div>
      <h2>Lista de Cursos</h2>
      <select
        required
        className="form-select"
        aria-label="Selecciona un curso"
        name="curso"
        id="curso"
      >
        <option value="">Selecciona un curso</option>
        {cursos.map((curso) => (
          <option key={curso._id} value={curso._id}>
            {curso.nombre}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CursosList;
