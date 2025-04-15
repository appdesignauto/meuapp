import multer from "multer";

// Configura o multer para armazenar arquivos em memória
// permitindo manipulação antes de enviar para o R2
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Limita o upload a 10MB
  },
  fileFilter: (req, file, cb) => {
    // Aceita apenas imagens
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Apenas imagens são permitidas"));
    }
    cb(null, true);
  },
});

export default upload;