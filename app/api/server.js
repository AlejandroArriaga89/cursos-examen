const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const authenticateJWT = require("../../authMiddleware");
const { NextResponse } = require("next/server");
const { S3Client, Upload } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: "ASIASBGPPQ6FMQNYXE74",
    secretAccessKey: "PzP0wArms/DCWFt5N4FQYXHkkMoQJyjxNxRXxV2t",
    sessionToken:
      "IQoJb3JpZ2luX2VjEPD//////////wEaCXVzLXdlc3QtMiJIMEYCIQCvekoy+G4J/VyfizfizLjSq1GMBF8eHGuNUHD41+//xAIhAK56xrjg4OCv7xk19VqfX/1Eh2PH+AtRUQNJlnW7QPssKrICCHkQABoMMTQwMDIxNTY1MzIyIgwVIzD06KAzU2TrUtUqjwJJHWGJAk774gJYWIthEpIJcEhBMwVzELMytfvhm1xhcqJHSyUcH0kQ7DXk061iUQ99hH6V9LHLebFLLbDw7xdD3iucXYcMrz1P6arZU2oQiPOlIxVQzKaEMWmux0uC4jgYB9yxBreHjwBKRD1rUntpOlEcHIPwncyu5r7RoYPQQCRoRoBkWQTk8lxfs4n77ycdq3JpuJphZOvFyPMM5R9vgMvJF6m7F55ZgOVJ3cLYmH2pKthhAa23aCz89sfHYjwZ7Pg8BFhdihF1nQNNBW9BwVmmrmd34Qxs/3p2Xi0T8U2eB8xeNOU7dmMW2CN+uYKkBa8D449m1W5XQH2IlQFaAsOu++TL92nBJCYWDoOdMN2f8rIGOpwBBOr7a7XKxIj7sihN7ngPQI467xQI/q3wJXWdvgRdtjN6ZoIXBh0ZYKQr4adcIga9zCOQyiNkgzcbNn6Pk2yWv80f1zGNkgEV/M/Ll0xS81s+Ly5pHhUc1R5z9GP+qYmaZrR0V+tILiC3NRY83YgI4pWXAjnpIESv2YaROte5QoJCAhPF5N6pwEu5lOEYQH97QPWE56FIE/hZ+JT7",
  },
});

async function uploadFileToS3(file, fileName) {
  const fileBuffer = file;
  console.log(fileName);

  const params = {
    Bucket: "cursos-examen",
    Key: `fotos/${fileName}-${Date.now}`,
    Body: fileBuffer,
    ContentType: "image/jpg",
  };
  const command = new Upload(params);
  await s3Client.send(command);
  return fileName;
}

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Conexión a MongoDB
mongoose
  .connect(
    "mongodb+srv://19030837:19030837@cluster0.tgklsyk.mongodb.net/gestion_cursos",
    {}
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

// Esquema de Curso
const cursoSchema = new mongoose.Schema({
  id: String,
  nombre: String,
  descripcion: String,
  duracion: String,
  lugar: String,
  requerimientosTecnicos: String,
  capacidad: Number,
  horario: String,
  materiales: [{ nombre: String, url: String }],
});

// Esquema de Participante
const participanteSchema = new mongoose.Schema({
  id: Number,
  nombreCompleto: String,
  email: String,
  direccion: String,
  password: String,
  telefono: String,
  foto: String,
});

// Esquema de Inscripcion
const inscripcionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "participantes" },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "cursos" },
});

// Modelo de Inscripcion
const Inscripcion = mongoose.model("inscripciones", inscripcionSchema);

// Modelo de Curso
const Curso = mongoose.model("cursos", cursoSchema);

// Modelo de Participante
const Participante = mongoose.model("participantes", participanteSchema);

// Endpoint para inscribir a un usuario en un curso (protegido)
app.post("/inscribir", authenticateJWT, async (req, res) => {
  try {
    const { userId, courseId } = req.body;

    // Verificar si el usuario ya está inscrito en el curso
    const inscripcionExistente = await Inscripcion.findOne({
      userId,
      courseId,
    });
    if (inscripcionExistente) {
      return res.status(400).json({ error: "Ya estás inscrito en este curso" });
    }

    // Verificar la cantidad de cursos en los que el usuario está inscrito
    const inscripcionesUsuario = await Inscripcion.countDocuments({ userId });
    if (inscripcionesUsuario >= 3) {
      return res
        .status(400)
        .json({ error: "No puedes inscribirte en más de 3 cursos" });
    }

    // Obtener el curso
    const curso = await Curso.findById(courseId);
    if (!curso) {
      return res.status(404).json({ error: "Curso no encontrado" });
    }

    // Verificar si hay capacidad disponible
    if (curso.capacidad < 1) {
      return res
        .status(400)
        .json({ error: "No hay capacidad disponible en este curso" });
    }

    // Crear la inscripción
    const nuevaInscripcion = new Inscripcion({ userId, courseId });
    await nuevaInscripcion.save();

    // Reducir la capacidad del curso
    curso.capacidad -= 1;
    await curso.save();

    res.status(201).json(nuevaInscripcion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint para obtener las inscripciones de un usuario
app.get("/inscripciones/:userId", authenticateJWT, async (req, res) => {
  try {
    const { userId } = req.params;

    const inscripciones = await Inscripcion.find({ userId }).populate(
      "courseId"
    );

    res.json(inscripciones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint para eliminar una inscripción
app.delete("/inscripciones/:id", authenticateJWT, async (req, res) => {
  try {
    const inscripcion = await Inscripcion.findById(req.params.id);
    if (!inscripcion) {
      return res.status(404).json({ error: "Inscripción no encontrada" });
    }

    // Aumentar la capacidad del curso
    const curso = await Curso.findById(inscripcion.courseId);
    curso.capacidad += 1;
    await curso.save();

    // Eliminar la inscripción
    await Inscripcion.deleteOne({ _id: inscripcion._id });

    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint para obtener todos los cursos (protegido)
app.get("/cursos", authenticateJWT, async (req, res) => {
  try {
    const cursos = await Curso.find();
    res.json(cursos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint para obtener un curso específico por ID (protegido)
app.get("/cursos/:id", authenticateJWT, async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.id);
    if (!curso) {
      return res.status(404).json({ error: "Curso no encontrado" });
    }
    res.json(curso);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint para crear un nuevo curso (protegido)
app.post("/cursos", authenticateJWT, async (req, res) => {
  try {
    const nuevoCurso = new Curso(req.body);
    await nuevoCurso.save();
    res.status(201).json(nuevoCurso);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint para actualizar un curso existente (protegido)
app.put("/cursos/:id", authenticateJWT, async (req, res) => {
  try {
    const cursoActualizado = await Curso.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(cursoActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint para eliminar un curso (protegido)
app.delete("/cursos/:id", authenticateJWT, async (req, res) => {
  try {
    await Curso.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint para obtener todos los participantes (protegido)
app.get("/participantes", async (req, res) => {
  try {
    const participantes = await Participante.find();
    res.json(participantes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint para crear un nuevo participante
app.post("/participantes", async (req, res) => {
  try {
    const nuevoParticipante = new Participante(req.body);
    await nuevoParticipante.save();
    res.status(201).json(nuevoParticipante);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint para actualizar un participante existente (protegido)
app.put("/participantes/:id", authenticateJWT, async (req, res) => {
  try {
    const participanteActualizado = await Participante.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(participanteActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint para eliminar un participante (protegido)
app.delete("/participantes/:id", async (req, res) => {
  try {
    await Participante.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint para iniciar sesión
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Participante.findOne({ email });

    if (!usuario) {
      return res.status(401).json({ error: "Error en correo" });
    }

    if (password === usuario.password) {
      const token = jwt.sign(
        { email: usuario.email, id: usuario._id },
        "secreto",
        { expiresIn: "1h" }
      );
      res.status(200).json({ token, userId: usuario._id });
    } else {
      res.status(401).json({ error: "Credenciales incorrectas" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint para registro de usuarios
app.post("/register", upload.single("fotografia"), async (req, res) => {
  try {
    const { nombreCompleto, email, direccion, telefono, password } = req.body;
    const fotografia = req.file ? req.file.buffer : null;

    const ultimoParticipante = await Participante.findOne()
      .sort({ id: -1 })
      .exec();

    const nuevoId = ultimoParticipante ? ultimoParticipante.id + 1 : 1;

    const nuevoParticipante = new Participante({
      id: nuevoId,
      nombreCompleto,
      email,
      direccion,
      telefono,
      password,
      foto: fotografia ? `fotos/${nuevoId}` : null, // Guardamos la ruta en S3 si hay foto
    });

    // Si hay foto, la subimos a S3

    console.log("Sí hay fotografía");
    const fileName = `${nuevoId}-${Date.now()}.jpg`; // Nombre del archivo en S3
    console.log(fileName);
    typeFile = await uploadFileToS3(fotografia, fileName); // Subimos la foto a S3
    console.log(typeFile);

    await nuevoParticipante.save();
    res.status(201).json(nuevoParticipante);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
