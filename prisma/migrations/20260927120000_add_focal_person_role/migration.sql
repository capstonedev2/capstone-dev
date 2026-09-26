-- A Research Focal Person gets their own account (System Admin creates it) and the Focal Person module.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'focal_person';
