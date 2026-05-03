<div align="center">
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/NextJS-Dark.svg" width="60" alt="NextJS"/>
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/NodeJS-Dark.svg" width="60" alt="NodeJS"/>
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/MySQL-Dark.svg" width="60" alt="MySQL"/>
  <img src="https://cdn.simpleicons.org/clickhouse/FFCC01" width="60" alt="ClickHouse"/>

  <br/>
  <br/>

  <h1>FiveM Log Management System</h1>
  <p>
    An open-source, easily expandable logging foundation designed to provide deep structural insights for FiveM servers.
  </p>

  <p>
    <a href="#features">Features</a> •
    <a href="#showcase">Showcase</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#documentation">Documentation</a> •
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

The **FiveM Log Management System** provides administrators and developers with real-time insights into server events. Built around **ClickHouse** for fast columnar analytics and **Next.js** for a modern admin dashboard, it serves as a solid, developer-friendly starting point that you can easily fork, expand, and tailor to your server's exact needs.

Stop relying on slow, unsearchable Discord webhook logs. Take control of your server's data with advanced filtering and weapon/vehicle statistics aggregations.

## Features

- **High-Throughput Ingestion:** Custom Node.js backend handles thousands of events per second via optimized async bulk processing.
- **ClickHouse Powered:** Columnar storage with parameterized SQL search, pagination, and sub-second analytical aggregations over billions of rows.
- **Secure OAuth2 Auth:** Seamless staff login using Discord. Automated server-access resolution via Discord Guild membership.
- **Rich Analytics:** Automated statistical tracking of weapons used, vehicles spawned, and economic transactions.
- **Modern Dashboard:** Next.js App Router, `shadcn/ui`, and Tailwind CSS combined for a flawless, snappy user experience.
- **Plug & Play Lua:** A lightweight, non-blocking FiveM resource utilizing standard `exports` to drop straight into your existing frameworks (QBCore, ESX, or Custom).

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

1. **Ingest (Node.js):** A lightweight API that blindly accepts massive batches of JSON logs from your game server.
2. **Storage (ClickHouse):** Acts as the time-series analytics database for billions of log rows, with MergeTree partitioning, TTL-based retention, and sub-second analytical SQL.
3. **Storage (MySQL):** Used exclusively for managing relational configuration data (like `servers` and `users`).
4. **Dashboard (Next.js):** The proxy layer. It verifies Discord credentials via MySQL before securely querying the ClickHouse-backed ingest API on the user's behalf.

For a deeper dive into the system design, please review the full **[Architecture Overview](ARCHITECTURE.md)**.

## Repository Structure

```text
fivem-log-system/
├── backend/               # Node.js Ingest REST API & ClickHouse schema
├── dashboard/             # Next.js 14 Web Application (UI & Auth)
├── docs/                  # Extensive technical documentation
├── ARCHITECTURE.md        # Deep dive into distributed architecture
└── CONTRIBUTING.md        # Guidelines for pull requests and community
```

## Getting Started

Getting your logging infrastructure up and running involves three main components: the database, the ingest backend, and the dashboard. 

For the most comprehensive guide, please refer to our **[Full Setup Guide](docs/SETUP.md)**.

### Quick Start Summary

#### 1. Requirements
Ensure you have installed: **Node.js 22+**, **MySQL 8.0+**, and **ClickHouse 24+**. You will also need a registered Discord Developer App for OAuth2.

#### 2. Backend & Ingest Server
```bash
cd backend
npm install
cp env.example .env

# Edit .env with your configuration
npm run dev
```

#### 3. Frontend Dashboard
```bash
cd dashboard
npm install
cp env.example .env.local

# Edit .env.local (Discord IDs, etc)
npm run dev
```

### 4. Lua Integration
Move the `fivem-logging.lua` into your FiveM Server's resource folder and add the appropriate API keys to your `server.cfg`. Read the [Integration Docs](docs/INTEGRATION.md) for details.

## Documentation

We believe in making powerful tools easy to use through exceptional documentation. Dive deeper into the specific areas of the exact systems you wish to explore:

- **[Architecture Overview](ARCHITECTURE.md):** Understand the flow of data from game server to ClickHouse.
- **[Installation & Setup](docs/SETUP.md):** Step-by-step instructions from a blank VPS to a production-ready application.
- **[API Reference](docs/API_REFERENCE.md):** Connect external tools or write your own custom log ingesters using the REST API.
- **[FiveM Integration](docs/INTEGRATION.md):** Implement Lua exports directly into your existing scripts.

## Roadmap & Upcoming Features

Because this is a growing foundation, several advanced features are planned for future iterations to make it even more capable:

- **Role-Based Access Control (RBAC):** Granular channel and event access limits based on specific Discord Roles (so local-moderators can only see assigned logs).
- **Expanded Aggregations:** More detailed charts and graphs for economy tracking natively in the dashboard.
- **Enhanced Lua Exports:** Even more pre-configured exports for popular unified frameworks.

## Contributing

This project is built by the community, for the community. Contributions, issues, and feature requests are always welcome! 

Please read our [Contributing Guidelines](CONTRIBUTING.md) to learn how to open a PR, report issues, and follow our code structuring standards.

## License

This project is open-sourced under the **[MIT License](LICENSE)**. You are free to modify, distribute, and utilize this software commercially.
