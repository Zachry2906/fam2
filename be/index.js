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

const corsOptions = 
{
    origin: ["https://fe-077-dot-noted-cider-459904-e7.ue.r.appspot.com/"], // <- Support both localhost and 127.0.0.1
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
  }

app.set("view engine", "ejs");

app.use(cookieParser());
app.use(
  cors(corsOptions)
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
    const port = process.env.PORT || 3000;
    app.listen(port, '0.0.0.0', () => {
        console.log(`Server is running on port ${port}`);
    });
}).catch((error) => {
    console.error('Failed to initialize models:', error);
});