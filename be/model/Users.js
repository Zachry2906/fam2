import { Sequelize } from "sequelize";
import db from "../config/db.js";

const User = db.define(
  "user",
  {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    refresh_token: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  }
);

export default User;