import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import familyRoutes from './routes/famillyRoutes.js';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes.js';
import "dotenv/config";
import { initializeModels } from './model/index.js'; 

const app = express();
app.set("view engine", "ejs");

app.use(cors({
 origin: [
    "https://fe-077-dot-noted-cider-459904-e7.ue.r.appspot.com",
    "http://localhost:3000",
  ], 
  credentials: true, 
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
})); 

app.use(express.json());
app.use(cookieParser());

app.use('/api', familyRoutes);
app.use('/api', userRoutes);

initializeModels().then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}).catch((error) => {
    console.error('Failed to initialize models:', error);
});