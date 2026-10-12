# OpenLead Property Finder - Implementation Plan

Based on the product requirements document, here is the phased implementation plan for the OpenLead Property Finder application. The tech stack will be **React, TypeScript, Tailwind CSS, and Supabase**, adhering to the preferred high-density, "Light Glass" UI design.

## PHASE 1: Core Foundation & Dashboard
- **Application Shell:** Set up the React (Vite) project with TypeScript, Tailwind CSS, and routing.
- **Authentication:** Implement Supabase Auth (email/password).
- **Database Schema:** Deploy the initial Supabase PostgreSQL schema, Row Level Security (RLS) policies, and foreign keys.
- **UI Components:** Build the "Light Glass" layout, high-density data tables (fixed width, ellipsis truncation), and navigation.
- **Property Database View:** Create the searchable, filterable table for properties with pagination and CSV export capability.
- **Mock Data:** Populate initial views with clearly labelled test data to verify UI functionality.

## PHASE 2: Data Ingestion & Roof Assessment
- **VOA API Integration:** Create the provider adapter for the VOA Business Rates API (or alternative) to discover commercial properties.
- **Background Processing:** Set up asynchronous job queues for handling large geographic searches.
- **Google Solar API:** Integrate the building insights endpoint to estimate roof sizes and identify properties >150 m².
- **Qualification Pipeline:** Automate the transition of properties from "Discovered" to "Awaiting roof assessment" to "Roof qualified" based on size.

## PHASE 3: Classification & Company Matching
- **Metal-Roof Classification:** Implement the roof-material classification workflow (manual review interface and API stubs for future ML integration).
- **Google Places & Companies House:** Build integrations to match property addresses with business entities.
- **Company Matching Logic:** Associate businesses as owners/occupiers, preventing duplicates and storing match confidence.

## PHASE 4: Contact Enrichment & Cost Control
- **Lusha Integration:** Integrate the Lusha API for contact enrichment, targeting specific decision-maker roles (MD, Operations, etc.).
- **Qualification Pipeline Completion:** Advance properties to "Qualified prospect" once contacts are enriched.
- **Cost Controls:** Implement configurable daily limits, request thresholds, duplicate prevention, and pause/cancel job features.

## PHASE 5: Compliance, Testing & Deployment
- **Privacy & Compliance:** Implement suppression lists (do-not-contact), audit trails, and data-retention controls.
- **API Integrations Page:** Build the settings dashboard for managing API credentials securely.
- **Testing & Optimisation:** Write core tests, optimise database queries for the high-density tables, and finalize deployment instructions.
