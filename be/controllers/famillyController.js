import Person from "../model/Person.js";
import Relationship from "../model/Relationship.js";
import Sequelize from "sequelize";
import path from 'path';
import multer from 'multer';
import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path'; // PENTING: Tambahkan import ini
import { fileURLToPath } from 'url';

// Untuk ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const projectId = 'b-07-452412';
const bucketName = 'tcc-07-77';

// Konfigurasi Google Cloud Storage
let storage;
const keyFilename = path.join(__dirname, 'account-key.json');

try {
    // Cek apakah file key ada (untuk local development)
    storage = new Storage({
        keyFilename,
        projectId
    });
} catch (error) {
    console.log('Using default credentials (Cloud Run/Cloud Build environment)');
    // Untuk Cloud Run, gunakan default credentials
    storage = new Storage({
        projectId
    });
}

const bucket = storage.bucket(bucketName);

// Konfigurasi Multer
const multerStorage = multer.memoryStorage();
const upload = multer({
    storage: multerStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit 5MB
    fileFilter: function(req, file, cb) {
        // Validasi lebih ketat untuk file type
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedMimes.includes(file.mimetype)) {
            return cb(new Error('Only image files (JPEG, PNG, GIF) are allowed!'), false);
        }
        cb(null, true);
    }
}).single('photo');

export const uploadPhoto = (req, res) => {
    console.log('Upload photo request received');
    
    upload(req, res, async function(err) {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ 
                error: err.message,
                details: 'File upload validation failed'
            });
        }

        if (!req.file) {
            console.error('No file in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('File received:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        try {
            // Create unique filename
            const timestamp = Date.now();
            const randomSuffix = Math.round(Math.random() * 1E9);
            const ext = path.extname(req.file.originalname).toLowerCase();
            const filename = `photos/photo-${timestamp}-${randomSuffix}${ext}`;

            console.log('Uploading to GCS with filename:', filename);

            // Upload to Google Cloud Storage
            const blob = bucket.file(filename);
            const blobStream = blob.createWriteStream({
                resumable: false,
                metadata: {
                    contentType: req.file.mimetype,
                    // Tambahkan metadata untuk public access
                    cacheControl: 'public, max-age=31536000'
                }
            });

            blobStream.on('error', (error) => {
                console.error('GCS upload error:', error);
                return res.status(500).json({ 
                    error: 'Failed to upload file to storage',
                    details: error.message 
                });
            });

            blobStream.on('finish', async () => {
                try {
                    console.log('File uploaded successfully to GCS');
                    
                    // Make file publicly accessible
                    await blob.makePublic();
                    
                    // Generate public URL
                    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;
                    
                    console.log('Public URL generated:', publicUrl);
                    
                    res.json({
                        success: true,
                        message: 'File uploaded successfully',
                        filename: filename,
                        publicUrl: publicUrl,
                        originalName: req.file.originalname,
                        size: req.file.size
                    });
                } catch (publicError) {
                    console.error('Error making file public:', publicError);
                    
                    // File uploaded but failed to make public
                    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;
                    res.json({
                        success: true,
                        message: 'File uploaded successfully (may need manual public access setup)',
                        filename: filename,
                        publicUrl: publicUrl,
                        warning: 'File may not be publicly accessible'
                    });
                }
            });

            // Start upload
            blobStream.end(req.file.buffer);
            
        } catch (error) {
            console.error('General error in upload process:', error);
            return res.status(500).json({ 
                error: 'Internal server error during upload',
                details: error.message 
            });
        }
    });
};

// Improved family data retrieval to include spouse relationships
export const getFamily = async (req, res) => {
    const userId = req.id; // Ambil userId dari token yang sudah diverifikasi
    console.log("GetFamily - User ID from token:", userId);
    
    // Verify we have a valid userId
    if (!userId) {
        console.error("GetFamily - Missing userId in request");
        return res.status(401).json({ error: "Authentication required - userId not found" });
    }
    
    try {
        // First, get all persons with their basic information
        console.log("GetFamily - Fetching persons for userId:", userId);
        const persons = await Person.findAll({
            where: { userId: userId },
            attributes: [
                'id', 'name', 'email', 'gender', 'born', 'photo', 'fid', 'mid', 'userId'
            ]
        });

        console.log(`GetFamily - Found ${persons.length} person records for userId: ${userId}`);
        
        // For debugging purposes, if zero records found, check if records exist for other userIds
        if (persons.length === 0) {
            const allUsers = await Person.findAll({
                attributes: ['userId'],
                group: ['userId']
            });
            console.log("Available userIds in database:", allUsers.map(u => u.userId));
        }

        // Then, get all spouse relationships for this user's persons only
        const personIds = persons.map(p => p.id);
        const allRelationships = await Relationship.findAll({
            where: { 
                relationship_type: 'spouse',
                person_id: personIds  // Only get relationships for this user's persons
            }
        });

        // Create a map of person_id to array of spouse IDs
        const spouseMap = {};
        allRelationships.forEach(rel => {
            if (!spouseMap[rel.person_id]) {
                spouseMap[rel.person_id] = [];
            }
            spouseMap[rel.person_id].push(rel.related_person_id);
        });

        // Map persons to include their spouse IDs
        const familyData = persons.map(person => {
            const personObj = person.toJSON();
            return {
                ...personObj,
                pids: spouseMap[person.id] || []
            };
        });

        console.log(`GetFamily - Returning ${familyData.length} family members for userId: ${userId}`);
        res.json(familyData);
    } catch (error) {
        console.error('Error in getFamily:', error);
        res.status(500).json({ error: error.message });
    }
};

export const createFamily = async (req, res) => {
    const transaction = await Person.sequelize.transaction();
    const userId = req.id; // Ambil userId dari token yang sudah diverifikasi
    try {
        let { id, name, email, gender, born, photo, fid, mid, pids } = req.body;

        // Process the incoming fields
        fid = fid && fid !== "null" ? fid : null;
        mid = mid && mid !== "null" ? mid : null;

        // Create the person record
        const person = await Person.create({
            name,
            email,
            gender,
            born,
            photo,
            fid,
            mid,
            userId
        }, { transaction });

        // Handle spouse relationships if provided
        if (pids && Array.isArray(pids) && pids.length > 0) {
            // Create relationships for all spouses
            for (const spouseId of pids) {
                // Check if spouse exists
                const spouse = await Person.findByPk(spouseId, { transaction });

                if (spouse) {
                    // Create bidirectional spouse relationship
                    await Relationship.create({
                        person_id: person.id,
                        related_person_id: spouseId,
                        relationship_type: 'spouse'
                    }, { transaction });

                    await Relationship.create({
                        person_id: spouseId,
                        related_person_id: person.id,
                        relationship_type: 'spouse'
                    }, { transaction });
                }
            }
        }

        await transaction.commit();

        const response = {
            message: "Person added successfully",
            data: {
                id: person.id,
                name,
                email,
                gender,
                born,
                photo,
                fid,
                mid,
                pids: pids || [],
                userId
            }
        };

        res.status(201).json(response);
    } catch (error) {
        await transaction.rollback();
        console.error('Error in createFamily:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getRelationships = async (req, res) => {
    try {
        const { person_id, related_person_id } = req.query;

        const whereClause = {};
        if (person_id) whereClause.person_id = person_id;
        if (related_person_id) whereClause.related_person_id = related_person_id;

        const relationships = await Relationship.findAll({ where: whereClause });

        res.json(relationships);
    } catch (error) {
        console.error('Error in getRelationships:', error);
        res.status(500).json({ error: error.message });
    }
};

export const createRelationship = async (req, res) => {
    const transaction = await Relationship.sequelize.transaction();

    try {
        const { person_id, related_person_id, relationship_type } = req.body;

        // Check if relationship already exists to avoid duplicates
        const existingRelationship = await Relationship.findOne({
            where: {
                person_id,
                related_person_id,
                relationship_type
            }
        }, { transaction });

        if (existingRelationship) {
            await transaction.commit();
            return res.status(200).json({
                message: "Relationship already exists",
                data: { id: existingRelationship.id }
            });
        }

        // Create new relationship
        const relationship = await Relationship.create({
            person_id,
            related_person_id,
            relationship_type
        }, { transaction });

        // Add reverse relationship if spouse
        if (relationship_type === 'spouse') {
            // Check if reverse relationship exists
            const existingReverseRelationship = await Relationship.findOne({
                where: {
                    person_id: related_person_id,
                    related_person_id: person_id,
                    relationship_type
                }
            }, { transaction });

            if (!existingReverseRelationship) {
                await Relationship.create({
                    person_id: related_person_id,
                    related_person_id: person_id,
                    relationship_type
                }, { transaction });
            }
        }

        await transaction.commit();

        const response = {
            message: "Relationship added successfully",
            data: { id: relationship.id }
        };

        res.status(201).json(response);
    } catch (error) {
        await transaction.rollback();
        console.error('Error in createRelationship:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getFamilyById = async (req, res) => {
    try {
        const personId = req.params.id;
        const person = await Person.findByPk(personId);

        if (!person) {
            return res.status(404).json({ error: "Person not found" });
        }

        // Get spouse relationships
        const spouseRelationships = await Relationship.findAll({
            where: {
                person_id: personId,
                relationship_type: 'spouse'
            }
        });

        const spouseIds = spouseRelationships.map(rel => rel.related_person_id);

        // Convert to response format
        const personData = {
            ...person.toJSON(),
            pids: spouseIds
        };

        res.json(personData);
    } catch (error) {
        console.error('Error in getFamilyById:', error);
        res.status(500).json({ error: error.message });
    }
};

export const updateFamily = async (req, res) => {
    const transaction = await Person.sequelize.transaction();
    const userId = req.id; // Ambil userId dari token yang sudah diverifikasi

    try {
        const personId = req.params.id;
        const { name, email, gender, born, photo, fid, mid, pids } = req.body;

        const person = await Person.findByPk(personId, { transaction });
        if (!person) {
            await transaction.rollback();
            return res.status(404).json({ error: "Person not found" });
        }

        // Process parent IDs
        let validFid = fid && fid !== "null" ? fid : null;
        let validMid = mid && mid !== "null" ? mid : null;

        // Handle father relationship if provided
        if (validFid) {
            const father = await Person.findByPk(validFid, { transaction });
            if (!father) {
                const newFather = await Person.create({
                    name: "Unknown Father",
                    gender: "male",
                    born: null,
                    photo: null,
                    userId : userId
                }, { transaction });
                validFid = newFather.id;
                // // ambil id ayah yang baru dibuat
                // // hapus id ayah yang lama, karena waktu buat di fe langsung buat 2 node
                // const deletePrevieousId = await Person.findByPk(validFid - 1, { transaction });
                // await deletePrevieousId.destroy();
            }
        }

        // Handle mother relationship if provided
        if (validMid) {
            const mother = await Person.findByPk(validMid, { transaction });
            if (!mother) {
                const newMother = await Person.create({
                    name: "Unknown Mother",
                    gender: "female",
                    born: null,
                    photo: null,
                    userId : userId
                }, { transaction });
                    validMid = newMother.id;
                    // const deletePrevieousId = await Person.findByPk(validMid - 1, { transaction });
                    // await deletePrevieousId.destroy();
            }
        }

        // Create parent relationship if both parents exist
        if (validFid && validMid) {
            // Check if relationship already exists
            const existingRelationship = await Relationship.findOne({
                where: {
                    person_id: validFid,
                    related_person_id: validMid,
                    relationship_type: 'spouse'
                },
                transaction
            });

            if (!existingRelationship) {
                // Create bidirectional spouse relationship between parents
                await Relationship.create({
                    person_id: validFid,
                    related_person_id: validMid,
                    relationship_type: 'spouse'
                }, { transaction });

                await Relationship.create({
                    person_id: validMid,
                    related_person_id: validFid,
                    relationship_type: 'spouse'
                }, { transaction });
            }
        }

        // In updateFamily function, update the photo handling:
        // Process photo
        const updatedPhoto = photo && !photo.includes("storage.googleapis.com/tugas-7/")
            ? `storage.googleapis.com/tugas-7/${photo}`  // Tambahkan base URL jika belum ada
            : photo;  // Gunakan URL lengkap jika sudah ada

        // Delete old photo if changed
        if (person.photo && person.photo !== updatedPhoto) {
            try {
                const oldPhotoFilename = path.basename(person.photo);
                await bucket.file(oldPhotoFilename).delete();
                console.log(`Successfully deleted old photo ${oldPhotoFilename}`);
            } catch (error) {
                console.error('Error deleting old photo from Cloud Storage:', error);
                // Continue with update even if old photo deletion fails
            }
        }

        // Update person record
        await person.update({
            name,
            gender,
            email,
            born,
            photo: updatedPhoto,
            fid: validFid,
            mid: validMid,
            userId : userId
        }, { transaction });

        // Handle spouse relationships if provided
        if (pids && Array.isArray(pids)) {
            // Get current spouse relationships
            const currentSpouseRelationships = await Relationship.findAll({
                where: {
                    person_id: personId,
                    relationship_type: 'spouse'
                },
                transaction
            });

            const currentSpouseIds = currentSpouseRelationships.map(rel => rel.related_person_id);

            // Remove relationships that no longer exist
            for (const currentSpouseId of currentSpouseIds) {
                if (!pids.includes(currentSpouseId)) {
                    await Relationship.destroy({
                        where: {
                            person_id: personId,
                            related_person_id: currentSpouseId,
                            relationship_type: 'spouse'
                        },
                        transaction
                    });

                    await Relationship.destroy({
                        where: {
                            person_id: currentSpouseId,
                            related_person_id: personId,
                            relationship_type: 'spouse'
                        },
                        transaction
                    });
                }
            }

            // Add new relationships
            for (const spouseId of pids) {
                if (!currentSpouseIds.includes(spouseId)) {
                    // Create bidirectional relationship
                    await Relationship.create({
                        person_id: personId,
                        related_person_id: spouseId,
                        relationship_type: 'spouse'
                    }, { transaction });

                    await Relationship.create({
                        person_id: spouseId,
                        related_person_id: personId,
                        relationship_type: 'spouse'
                    }, { transaction });
                }
            }
        }

        await transaction.commit();

        res.json({
            message: "Family member updated successfully",
            data: {
                id: personId,
                name,
                gender,
                email,
                born,
                photo: updatedPhoto,
                fid: validFid,
                mid: validMid,
                pids: pids || [],
                userId
            }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error in updateFamily:', error);
        res.status(500).json({ error: error.message });
    }
};

export const deleteFamily = async (req, res) => {
    const transaction = await Person.sequelize.transaction();

    try {
        const personId = req.params.id;
        const personToDelete = await Person.findByPk(personId, { transaction });

        if (!personToDelete) {
            await transaction.rollback();
            return res.status(404).json({ error: "Person not found" });
        }

        // Delete photo if exists
        if (personToDelete.photo) {
            try {
                    const filename = path.basename(personToDelete.photo);
                    await bucket.file(filename).delete();
                    console.log(`Successfully deleted photo ${filename} from Cloud Storage`);
                } catch (error) {
                    console.error('Error deleting file from Cloud Storage:', error);
                }
        }

        // Delete all relationships
        await Relationship.destroy({
            where: {
                [Sequelize.Op.or]: [
                    { person_id: personId },
                    { related_person_id: personId }
                ]
            },
            transaction
        });

        // Update children that have this person as father
        await Person.update(
            { fid: null },
            {
                where: { fid: personId },
                transaction
            }
        );

        // Update children that have this person as mother
        await Person.update(
            { mid: null },
            {
                where: { mid: personId },
                transaction
            }
        );

        // Delete the person
        await personToDelete.destroy({ transaction });

        await transaction.commit();

        res.json({
            message: "Person and all related references deleted successfully",
            id: personId
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error in deleteFamily:', error);
        res.status(500).json({ error: error.message });
    }
};

// For local development, you might want to add this code to check your configuration
export const checkStorageConfig = async (req, res) => {
  try {
    // Check if bucket exists
    const [exists] = await bucket.exists();
    if (!exists) {
      return res.status(500).json({ 
        error: "Bucket does not exist. Please create the 'tugas-7' bucket in your GCP project."
      });
    }
    
    // Get bucket metadata
    const [metadata] = await bucket.getMetadata();
    
    res.json({
      message: "Storage configuration is valid",
      bucketName: bucketName,
      projectId: storage.projectId,
      bucketMetadata: {
        name: metadata.name,
        location: metadata.location,
        storageClass: metadata.storageClass
      }
    });
  } catch (error) {
    console.error('Storage configuration error:', error);
    res.status(500).json({ 
      error: "Failed to verify storage configuration. Check your service account key and permissions.",
      details: error.message
    });
  }
};