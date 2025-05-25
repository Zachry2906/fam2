import { Sequelize } from "sequelize";
import db from "../config/db.js";

const Person = db.define("person", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    name: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    email: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    gender: {
        type: Sequelize.ENUM('male', 'female'),
        allowNull: true
    },
    born: {
        type: Sequelize.DATE,
        allowNull: true
    },
    photo: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    fid: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    mid: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: "users", // Nama tabel user
            key: "id",
      },
    },
}, {
    timestamps: false
});


export default Person;