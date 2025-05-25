import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  // Ambil bearer token dari headers "authorization"
  const authHeader = req.headers["authorization"];
  let token;

  // Kalau bearer token ada, ambil access token-nya
  if (authHeader) token = authHeader.split(" ")[1];

  // Kalau access token-nya gaada, kirim respons error (401)
  if (!token) {
    return res.status(401).json({
      status: "Error",
      message: "Token tidak ada",
    });
  }

  // Verifikasi access token
  jwt.verify(
    token, // <- Token yang akan diverifikasi
    process.env.ACCESS_TOKEN_SECRET, // <- Secret key dari environment variables
    (error, decoded) => {
      // Jika ada error (access token tidak valid/kadaluarsa), kirim respons error
      if (error) {
        return res.status(403).json({
          status: "Error",
          message: "Access token tidak valid",
        });
      }

      console.log("isi decoded", decoded);
      // Jika verifikasi berhasil, simpan email dari payload token ke request
      req.name = decoded.name;
      req.id = decoded.id;

      // Lanjut ke controller berikutnya
      next();
    }
  );
};


