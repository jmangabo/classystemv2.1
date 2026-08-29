import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { getOrCreateUser } from "./src/db/users.ts";
import { db } from "./src/db/index.ts";
import { students, subjects, sections, schools, attendance, users } from "./src/db/schema.ts";
import { eq } from "drizzle-orm";
import { testMysqlConnection, initMysqlSchema } from "./src/db/mysql.ts";
import {
  mysqlUpsertUser,
  mysqlGetUser,
  mysqlGetAllUsers,
  mysqlGetSchoolYears,
  mysqlCreateSchoolYear,
  mysqlGetSections,
  mysqlUpsertSection,
  mysqlDeleteSection,
  mysqlGetStudents,
  mysqlBatchUpsertStudents,
  mysqlDeleteStudent,
  mysqlGetSubjects,
  mysqlBatchUpsertSubjects,
  mysqlGetTermGrades,
  mysqlBatchUpsertGrades,
  mysqlInsertScanLog,
  mysqlGetScanLogs,
  mysqlClearScanLogs,
  mysqlGetSetting,
  mysqlSetSetting,
  mysqlMigrateAllData,
  mysqlGetTableCounts
} from "./src/db/mysqlQueries.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for data migrations
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // 1. HEALTH & GENERAL API ROUTES
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Class Record Management Enterprise Server" });
  });

  // ----------------------------------------------------
  // 2. MYSQL DATABASE & MIGRATION ENDPOINTS
  // ----------------------------------------------------

  // MySQL Connection Status
  app.get("/api/mysql/health", async (req, res) => {
    const status = await testMysqlConnection();
    res.json(status);
  });

  // MySQL Schema Auto-Init
  app.post("/api/mysql/init-schema", async (req, res) => {
    const result = await initMysqlSchema();
    res.json(result);
  });

  // MySQL Table Row Counts
  app.get("/api/mysql/counts", async (req, res) => {
    try {
      const counts = await mysqlGetTableCounts();
      res.json({ success: true, counts });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Full Firebase -> MySQL Data Migration
  app.post("/api/mysql/migrate", async (req, res) => {
    try {
      // Ensure schema exists first
      await initMysqlSchema();
      const stats = await mysqlMigrateAllData(req.body);
      res.json({ success: true, stats });
    } catch (error: any) {
      console.error("Migration error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // MySQL Sections
  app.get("/api/mysql/sections", async (req, res) => {
    try {
      const schoolYear = req.query.schoolYear as string | undefined;
      const secList = await mysqlGetSections(schoolYear);
      res.json(secList);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/mysql/sections", async (req, res) => {
    try {
      await mysqlUpsertSection(req.body);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/mysql/sections/:sectionId", async (req, res) => {
    try {
      await mysqlDeleteSection(req.params.sectionId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // MySQL Section Details (Students, Subjects, Grades)
  app.get("/api/mysql/sections/:sectionId", async (req, res) => {
    try {
      const secId = req.params.sectionId;
      const [secStudents, secSubjects, secGrades] = await Promise.all([
        mysqlGetStudents(secId),
        mysqlGetSubjects(secId),
        mysqlGetTermGrades(secId)
      ]);
      res.json({
        students: secStudents,
        subjects: secSubjects,
        grades: secGrades
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // MySQL Attendance Scan & Logs
  app.post("/api/mysql/attendance/scan", async (req, res) => {
    try {
      await mysqlInsertScanLog(req.body);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/mysql/attendance/logs", async (req, res) => {
    try {
      const limit = parseInt((req.query.limit as string) || "200", 10);
      const logs = await mysqlGetScanLogs(limit);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/mysql/attendance/clear", async (req, res) => {
    try {
      await mysqlClearScanLogs(req.body.logIds);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // MySQL System Settings
  app.get("/api/mysql/settings/:key", async (req, res) => {
    try {
      const val = await mysqlGetSetting(req.params.key);
      res.json({ key: req.params.key, value: val });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/mysql/settings/:key", async (req, res) => {
    try {
      await mysqlSetSetting(req.params.key, req.body.value);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ----------------------------------------------------
  // 3. DRIZZLE/POSTGRES & AUTH COMPATIBILITY ROUTES
  // ----------------------------------------------------

  // Sync current user info to database
  app.post("/api/sync-user", requireAuth, async (req: AuthRequest, res) => {
    try {
      const firebaseUser = req.user;
      if (!firebaseUser) {
        return res.status(401).json({ error: "Missing authentication info" });
      }
      const userRecord = await getOrCreateUser(firebaseUser.uid, firebaseUser.email || "");
      res.json({ status: "success", user: userRecord });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get current user profile
  app.get("/api/user-profile", requireAuth, async (req: AuthRequest, res) => {
    try {
      const firebaseUser = req.user;
      if (!firebaseUser) {
        return res.status(401).json({ error: "Missing authentication info" });
      }
      const dbUsers = await db.select().from(users).where(eq(users.uid, firebaseUser.uid));
      if (dbUsers.length === 0) {
        const userRecord = await getOrCreateUser(firebaseUser.uid, firebaseUser.email || "");
        return res.json(userRecord);
      }
      res.json(dbUsers[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get schools
  app.get("/api/schools", requireAuth, async (req, res) => {
    try {
      const allSchools = await db.select().from(schools);
      res.json(allSchools);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create school (system_admin)
  app.post("/api/schools", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { schoolId, name, address } = req.body;
      const newSchool = await db.insert(schools)
        .values({ schoolId, name, address })
        .returning();
      res.json(newSchool[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get sections
  app.get("/api/sections", requireAuth, async (req, res) => {
    try {
      const allSections = await db.select().from(sections);
      res.json(allSections);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create section
  app.post("/api/sections", requireAuth, async (req, res) => {
    try {
      const { sectionId, gradeLevel, name, schoolId, adviserEmail } = req.body;
      const newSection = await db.insert(sections)
        .values({ sectionId, gradeLevel, name, schoolId, adviserEmail })
        .returning();
      res.json(newSection[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get students of a section
  app.get("/api/sections/:sectionId/students", requireAuth, async (req, res) => {
    try {
      const secId = String(req.params.sectionId);
      const secStudents = await db.select().from(students).where(eq(students.sectionId, secId));
      res.json(secStudents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get subjects of a section
  app.get("/api/sections/:sectionId/subjects", requireAuth, async (req, res) => {
    try {
      const secId = String(req.params.sectionId);
      const secSubjects = await db.select().from(subjects).where(eq(subjects.sectionId, secId));
      res.json(secSubjects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ----------------------------------------------------
  // 4. VITE MIDDLEWARE SETUP FOR DEV VS PRODUCTION
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
