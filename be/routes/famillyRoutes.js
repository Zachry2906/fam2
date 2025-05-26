import express from "express";
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

const router = express.Router();

router.get("/family", verifyToken, getFamily);
router.post("/family", verifyToken, createFamily);
router.get("/family/:id", verifyToken, getFamilyById);
router.put("/family/:id", verifyToken, updateFamily);
router.delete("/family/:id", verifyToken, deleteFamily);

router.get("/relationships", verifyToken, getRelationships);
router.post("/relationship", verifyToken, createRelationship);

router.post("/upload-photo", verifyToken, uploadPhoto);

export default router;