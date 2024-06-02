"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const RegisterForm = () => {
  const router = useRouter();

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [fotografia, setFotografia] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("nombreCompleto", nombreCompleto);
    formData.append("email", email);
    formData.append("direccion", direccion);
    formData.append("telefono", telefono);
    formData.append("password", password);
    formData.append("fotografia", fotografia);

    try {
      const response = await fetch("http://localhost:8000/register", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        router.push("/login");
      } else {
        console.error("Error al registrarse");
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5">
      <div className="mb-3">
        <label htmlFor="nombreCompleto" className="form-label">
          Nombre Completo:
        </label>
        <input
          type="text"
          className="form-control"
          id="nombreCompleto"
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="email" className="form-label">
          Email:
        </label>
        <input
          type="email"
          className="form-control"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="password" className="form-label">
          Password:
        </label>
        <input
          type="password"
          className="form-control"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="direccion" className="form-label">
          Dirección:
        </label>
        <input
          type="text"
          className="form-control"
          id="direccion"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="telefono" className="form-label">
          Teléfono:
        </label>
        <input
          type="text"
          className="form-control"
          id="telefono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="fotografia" className="form-label">
          Fotografía:
        </label>
        <input
          type="file"
          className="form-control"
          id="fotografia"
          onChange={(e) => setFotografia(e.target.files[0])}
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Registrarse
      </button>
    </form>
  );
};

export default RegisterForm;
