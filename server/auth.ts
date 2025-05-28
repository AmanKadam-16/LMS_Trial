import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

// Set up storage for profile photos
const profilePhotoDir = path.join(process.cwd(), 'uploads', 'profiles');

// Create directory if it doesn't exist
if (!fs.existsSync(profilePhotoDir)){
  fs.mkdirSync(profilePhotoDir, { recursive: true });
}

// Configure multer for profile photo uploads
const profilePhotoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, profilePhotoDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${ext}`);
  }
});

// Set up file filter to restrict file types
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only jpg, jpeg, png files
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Initialize multer upload
const upload = multer({ 
  storage: profilePhotoStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max file size
  },
  fileFilter
});

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Check if this is a hashed password (contains a period)
  if (stored.includes(".")) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } else {
    // Temporary plain-text comparison for development
    return supplied === stored;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "lms-session-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === "production",
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  // Register endpoint with profile photo upload
  app.post("/api/register", upload.single('profilePhoto'), async (req, res, next) => {
    try {
      const { 
        username, 
        password, 
        firstName, 
        lastName, 
        email, 
        role, 
        tenantId,
        mobileNumber,
        gender,
        dateOfBirth,
        educationLevel,
        schoolCollege,
        yearOfStudy
      } = req.body;
      
      // Check for required fields
      if (!username || !password || !firstName || !lastName || !email || 
          !mobileNumber || !dateOfBirth || !educationLevel || !schoolCollege || !yearOfStudy) {
        return res.status(400).send("Missing required fields");
      }
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      // Check if this is the first user in the system
      const userCount = await storage.getUserCount();
      
      // If this is the first user, make them an admin
      let userRole = "student";
      if (userCount === 0) {
        userRole = "admin";
      } else if (role) {
        userRole = role;
      }
      
      // Validate if tenant exists
      const tenant = await storage.getTenant(tenantId);
      if (!tenant) {
        return res.status(400).send("Invalid tenant ID");
      }

      // Get profile photo path if uploaded
      let profilePhotoPath = null;
      if (req.file) {
        // Store relative path from uploads directory
        profilePhotoPath = `profiles/${req.file.filename}`;
      }

      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        firstName,
        lastName,
        email,
        mobileNumber,
        gender,
        dateOfBirth,
        profilePhoto: profilePhotoPath,
        educationLevel,
        schoolCollege,
        yearOfStudy,
        role: userRole,
        tenantId: parseInt(tenantId as string, 10)
      });

      // Don't send password to client
      const { password: _, ...userWithoutPassword } = user;

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Don't send password to client
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.status(200).json(userWithoutPassword);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Don't send password to client
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });
  
  // Serve profile photos
  app.get("/uploads/:folder/:filename", (req, res) => {
    const folder = req.params.folder;
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', folder, filename);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('File not found');
    }
  });
}
