"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";

const CoursesList = () => {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No token found");
      return;
    }

    fetch("http://localhost:8000/cursos", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch courses");
        }
        return response.json();
      })
      .then((data) => {
        setCourses(data);
      })
      .catch((error) => {
        console.error("Error fetching courses:", error);
        setError(error.message);
      });
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (courses.length === 0) {
    return <div>No courses available</div>;
  }

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Available Courses</h1>
      <div className="row">
        {courses.map((course) => (
          <div key={course._id} className="col-md-4 mb-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">{course.nombre}</h5>
                <p className="card-text">{course.descripcion}</p>
                <button
                  className="btn btn-primary"
                  onClick={() => router.push(`/courses/${course._id}`)}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoursesList;
