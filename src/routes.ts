import { Router } from "express";
import { createProfile, getProfileById } from "./controllers/profile.controller";
import { createTechnology, listTechnologies } from "./controllers/technology.controller";
import { createProject, listProjects } from "./controllers/project.controller";

export const routes = Router();

// Profiles
routes.post("/profiles", createProfile);
routes.get("/profiles/:id", getProfileById);

// Technologies
routes.post("/technologies", createTechnology);
routes.get("/technologies", listTechnologies);

// Projects
routes.post("/projects", createProject);
routes.get("/projects", listProjects);
