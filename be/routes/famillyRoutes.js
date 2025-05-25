import express from "express";
import { fileURLToPath } from 'url';
import path from 'path';
import { 
    getFamily,
    createFamily,
    getRelationships,
    createRelationship,
    getFamilyById,
    updateFamily,
    deleteFamily,
    uploadPhoto   
} from "../controllers/famillyController.js";
import { verifyToken } from "../middleware/VerifyToken.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get("/family", verifyToken, getFamily);
router.post("/family", verifyToken, createFamily);
router.get("/family/:id", verifyToken, getFamilyById);
router.put("/family/:id", verifyToken, updateFamily);
router.delete("/family/:id", verifyToken, deleteFamily);

router.get("/relationships", verifyToken, getRelationships);
router.post("/relationship", verifyToken, createRelationship);

router.post("/upload-photo", verifyToken, uploadPhoto);

// Route view
router.get('/view', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'view', 'index.html'));
});

export default router;