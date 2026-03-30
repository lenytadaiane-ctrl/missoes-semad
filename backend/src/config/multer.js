const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads', 'missionarios'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const tipos = ['image/jpeg', 'image/png', 'image/webp'];
  if (tipos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error('TIPO_INVALIDO');
    cb(err, false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5 MB
  },
});

module.exports = upload;
