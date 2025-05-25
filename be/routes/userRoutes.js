import express from "express";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserById,
  login,
  logout,
} from "../controllers/UserController.js";
import { verifyToken } from "../middleware/VerifyToken.js";
import { getAccessToken } from "../controllers/TokenController.js";

const router = express.Router();

router.get("/token", getAccessToken);
router.post("/login", login);
router.delete("/logout", logout);
// Endpoint CRUD users
// Kita mau endpoint ini tu restricted,
// alias user yg mau akses endpoint ini harus login dulu,
// makanya kita kasih middleware fungsi verifyToken yg udah kita buat sebelumnya.
router.get("/users", verifyToken, getUsers);
router.get("/users/:id", verifyToken, getUserById);
router.post("/users", createUser);
router.put("/users/:id", verifyToken, updateUser);
router.delete("/users/:id", verifyToken, deleteUser);


export default router;