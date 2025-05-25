import Person from "./Person.js";
import Relationship from "./Relationship.js";
import User from "./Users.js";

const setupAssociations = () => {
    // Relasi: Person memiliki banyak Relationship sebagai "relationships"
    Person.hasMany(Relationship, {
        foreignKey: "person_id",
        as: "relationships" // Alias untuk relasi
    });

    // Relasi: Relationship terkait dengan satu Person sebagai "person"
    Relationship.belongsTo(Person, {
        foreignKey: "person_id",
        as: "person"
    });

    // Relasi: Relationship terkait dengan satu Person sebagai "relatedPerson"
    Relationship.belongsTo(Person, {
        foreignKey: "related_person_id",
        as: "relatedPerson"
    });

    User.hasMany(Person, { foreignKey: "userId", as: "person" });
    Person.belongsTo(User, { foreignKey: "userId", as: "user" });
};

export default setupAssociations;