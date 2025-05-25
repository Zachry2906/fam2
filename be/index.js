import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import familyRoutes from './routes/familyRoutes.js';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes.js';
import "dotenv/config"; // Import dotenv untuk mengakses variabel lingkungan
import { initializeModels } from './model/index.js'; // Import fungsi sinkronisasi

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("view engine", "ejs");

app.use(cookieParser());
app.use(
  cors({
    origin: [
      "https://fe-077-dot-noted-cider-459904-e7.ue.r.appspot.com",
      "http://localhost:3000",
      "http://127.0.0.1:3000"
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
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
    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
}).catch((error) => {
    console.error('Failed to initialize models:', error);
});