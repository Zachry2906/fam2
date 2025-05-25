import db from "../config/db.js";
import Person from "./Person.js";
import Relationship from "./Relationship.js";
import setupAssociations from "./Association.js";

const initializeModels = async () => {
    // setup relasi
    setupAssociations();

    // sinkronkan dengan database
    await db.sync({ alter: true }); // gunakan alter untuk memperbarui skema tanpa kehilangan data
    console.log("Models and associations initialized");
};

export { Person, Relationship, initializeModels };