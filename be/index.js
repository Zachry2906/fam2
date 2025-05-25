import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import familyRoutes from './routes/famillyRoutes.js';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes.js';
import "dotenv/config"; // Import dotenv untuk mengakses variabel lingkungan
import { initializeModels } from './model/index.js'; // Import fungsi sinkronisasi

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("view engine", "ejs");

// Apply CORS middleware before others like cookieParser and express.json
app.use(
  cors({
     origin: [
    "https://fe-077-dot-noted-cider-459904-e7.ue.r.appspot.com",
    "https://fam-1057648600827.us-central1.run.app"
  ], // Ganti dengan URL frontend yang terdeploy
  credentials: true, // Memungkinkan penggunaan cookies
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
  preflightContinue: false
  })
);

// Handle preflight requests explicitly
app.options('*', cors());

app.use(cookieParser());
app.use(express.json());

app.use('/view', express.static(path.join(__dirname, 'view')));

// Or if you want direct access to index.html at /view:
app.get('/view', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'index.html'));
});

// Gunakan route user dengan prefix "/api"
app.use('/api', familyRoutes);
app.use('/api', userRoutes);

// Sinkronisasi model sebelum server berjalan
initializeModels().then(() => {
    const port = 3000;
    app.listen(port, '0.0.0.0', () => {
        console.log(`Server is running on port ${port}`);
    });
}).catch((error) => {
    console.error('Failed to initialize models:', error);
});