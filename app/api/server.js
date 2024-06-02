const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const authenticateJWT = require("../../authMiddleware");
const { NextResponse } = require("next/server");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: "ASIASBGPPQ6FKJBC57W3",
    secretAccessKey: "PzP0wArms/CRft0fnxrDoN8GJ/yZCNq+naPRxPlHUnN6Msrxu7",
    sessionToken:
      "IQoJb3JpZ2luX2VjEPT//////////wEaCXVzLXdlc3QtMiJGMEQCIDA6lK+aio4H6gTFrCab1CCBCVdsEut9JryXFI3EC2zvAiAsFDTH+fy9LRAfXMoS6zWcQz5nrNkg2OE+Qij8a46kBCqyAgh9EAAaDDE0MDAyMTU2NTMyMiIMlrY6BTgtsOQbdtxNKo8C9gYi8peIYUvsVwTlr0ijiCrXgzRFZdR7+3RHPSU5AZJ+gkUUH8ZAyy4TmNMml+WVuEZ9tCmgfDz7vvKjL8Hos32lEQiw16p8Coszqf+2YxZp3EQ2EHKUb/jMpMcsjv5CvgErHGYuWKviwmIozKe0OopnST/Ho7EvWN6HQ1pw0v7PwkMR4YkHg4vBJZAcESy/w1JLLZotF8BxCxpHAZrTGjSbPvidNiZbqV8+kExHE1kwWUPx+S7iajCUzQNr0ZrfT/cj+JtpANHwyekJFb3RkspyFnigSnkDbf5LkAmygmSeCjRdrwwShAE/l9NPz7vgQ+aLDlmkIO/ObpCWwsedqvNE19sPbZWy7E1FC/plkDCbk/OyBjqeAdbxtmwx+UJ/IggsDDcmf823dPvDrFU7S/NNnfQw0T+VnTu7TeEP28tZOIlCjbmBIFZgj71iehWLJoXn9w9VpCC14M2Ao7kaQKEzPR9UTZtkHVAwCKVuxMNpTHceGCxQ0WL6WaHW+kmIfoVvpDnfNgsIux7AX4FMUyMJjKtPTwBvBX6NJc70rcvqIlVtb2p/VckJxzgp+rml0LbmcZTX",
  },
});

async function uploadFileToS3(file, fileName, endpoint) {
  console.log(fileName);

  const params = {
    Bucket: "cursos-examen",
    Key: `${endpoint}/${fileName}`,
    Body: file,
    ContentType: "image/jpg",
  };
  const command = new PutObjectCommand(params);
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
const upload = multer();

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
app.post("/participantes", authenticateJWT, async (req, res) => {
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
    if (fotografia) {
      const fileName = `${nuevoId}.jpg`; // Nombre del archivo en S3
      console.log(fileName);
      typeFile = await uploadFileToS3(fotografia, fileName, "fotos"); // Subimos la foto a S3
      console.log(typeFile);
    }

    await nuevoParticipante.save();
    res.status(201).json(nuevoParticipante);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint para registro de material
app.post("/upload", upload.single("archivo"), async (req, res) => {
  try {
    const archivo = req.file ? req.file.buffer : null;
    console.log(archivo);
    // Si hay foto, la subimos a S3

    typeFile = await uploadFileToS3(archivo, fileName, "materiales"); // Subimos la foto a S3
    console.log(typeFile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
