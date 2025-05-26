import express from 'express';
import cors from 'cors';
import familyRoutes from './routes/famillyRoutes.js';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes.js';
import "dotenv/config";
import { initializeModels } from './model/index.js'; 

const app = express();
app.set("view engine", "ejs");

app.use(cookieParser());

app.use(cors({
 origin: "https://fe-077-dot-b-07-452412.uc.r.appspot.com",
 credentials: true,
 methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
 allowedHeaders: ["Content-Type", "Authorization"],
 optionsSuccessStatus: 200
})); 

app.options('*', cors());

app.use(express.json());

app.use('/api', familyRoutes);
app.use('/api', userRoutes);

app.get('/', (req, res) => {
    res.render('index', { title: 'Family App' });
});

initializeModels().then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}).catch((error) => {
    console.error('Failed to initialize models:', error);
});