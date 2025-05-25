import { Sequelize } from "sequelize";
import db from "../config/db.js";

const Relationship = db.define("relationship", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    person_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    related_person_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    relationship_type: {
        type: Sequelize.STRING,
        allowNull: true
    }
}, {
    timestamps: false
});

export default Relationship;