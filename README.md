<div align="center">
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/NextJS-Dark.svg" width="60" alt="NextJS"/>
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/NodeJS-Dark.svg" width="60" alt="NodeJS"/>
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/refs/heads/main/icons/Elasticsearch-Dark.svg" width="60" alt="Elastic Search"/>
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/MySQL-Dark.svg" width="60" alt="MySQL"/>

  <br/>
  <br/>

  <h1>Elastic Telemetry</h1>
  <p>
    A high-throughput, asynchronous telemetry and log management pipeline.
  </p>

  <p>
    <a href="#showcase">Showcase</a> •
    <a href="#architecture">Architecture</a> •
    <a href="CONTRIBUTING.md">Contributing</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/version-1.0.0-blue.svg?style=for-the-badge" alt="Version"/>
    <img src="https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge" alt="License"/>
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge" alt="PRs Welcome"/>
  </p>
</div>

<hr/>

## Overview

**Elastic Telemetry** is a decoupled, event-driven log management system designed to handle high-frequency data streams. Built around **Elasticsearch** for rapid querying and aggregations, and **Next.js** for a modern telemetry dashboard, it provides a robust infrastructure capable of scaling to millions of events with minimal latency overhead.

While initially developed to solve the performance bottlenecks of game server logging (replacing slow, unsearchable Discord webhooks for FiveM), the ingest API is completely client-agnostic. It serves as a production-ready telemetry foundation that you can fork, expand, and deploy for any high-traffic application.

## Features

- **High-Throughput Ingestion:** Custom Node.js backend handles thousands of events per second via optimized async bulk processing.
- **Elasticsearch Powered:** Full-text search, pagination, and millisecond-level aggregations over massive datasets.
- **Secure OAuth2 Auth:** Seamless staff login using Discord OAuth. Automated access resolution via Guild membership roles.
- **Rich Analytics & Aggregation:** Automated statistical tracking of complex data (e.g., economic transactions, entity spawns, usage metrics).
- **Modern Dashboard:** Next.js App Router, `shadcn/ui`, and Tailwind CSS combined for a flawless, real-time user experience.
- **Client-Agnostic Core (with FiveM Adapter):** While the REST API accepts payloads from any source, it includes a lightweight, non-blocking Lua export wrapper for instant drop-in to FiveM frameworks (QBCore, ESX, or Custom).

## Showcase

Browse the current UI and dashboard flow in the dedicated [Showcase](SHOWCASE.md) gallery.

## Showcase Preview

<p align="center">
  <img src="https://github.com/user-attachments/assets/66525288-fdf6-42b3-a729-0df39d6e3f38" alt="Showcase screenshot 1" width="100%" />
</p>
<p align="center">
  <img src="https://github.com/user-attachments/assets/51c39270-747f-4201-8bdc-38ba39a77791" alt="Showcase screenshot 2" width="100%" />
</p>
<p align="center">
  <img src="https://github.com/user-attachments/assets/2b56df47-e797-4efa-bc20-244a7ecd202e" alt="Showcase screenshot 3" width="100%" />
</p>
<p align="center">
  <img src="https://github.com/user-attachments/assets/d69aaf7f-9db9-49a5-850d-f013109c946c" alt="Showcase screenshot 4" width="100%" />
</p>
<p align="center">
  <img src="https://github.com/user-attachments/assets/785ff1c8-c387-4b21-9a2a-73e2bbca9044" alt="Showcase screenshot 5" width="100%" />
</p>
<p align="center">
  <img src="https://github.com/user-attachments/assets/d3a2ad1e-abe6-4566-8741-5cae6609bdc9" alt="Showcase screenshot 6" width="100%" />
</p>
<p align="center">
  <img src="https://github.com/user-attachments/assets/7d89c6a6-56f6-4887-8900-35b14c1cdfa5" alt="Showcase screenshot 7" width="100%" />
</p>
<p align="center">
  <img src="https://github.com/user-attachments/assets/d56b5438-983b-47f2-a68d-d7e73f24729e" alt="Showcase screenshot 8" width="100%" />
</p>
<p align="center">
  <img src="https://github.com/user-attachments/assets/c0c79f45-6751-463f-86f8-3771d9e229fe" alt="Showcase screenshot 9" width="100%" />
</p>

## Architecture

The system operates on an event-driven decoupled model optimized for speed:

1. **Ingest (Node.js):** A lightweight API that non-blockingly accepts massive batches of JSON telemetry from any client.
2. **Storage (Elasticsearch):** Acts as the timeseries database for billions of logs, capable of instant aggregations and full-text searches.
3. **Relational Storage (MySQL):** Used exclusively for managing configuration and state data (like `servers` and `users`).
4. **Dashboard (Next.js):** The proxy layer. It verifies OAuth credentials via MySQL before securely querying Elasticsearch on the user's behalf.

For a deeper dive into the system design, please review the full **[Architecture Overview](ARCHITECTURE.md)**.

## Repository Structure

```text
elastic-telemetry/
├── backend/               # Node.js Ingest REST API & Elasticsearch mapping
├── dashboard/             # Next.js 14 Web Application (UI & Auth)
├── docs/                  # Extensive technical documentation
├── ARCHITECTURE.md        # Deep dive into distributed architecture
└── CONTRIBUTING.md        # Guidelines for pull requests and community
