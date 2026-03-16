---

# 🧠 Architecture Diagram

To visualize the system architecture, create a diagram located at:

```
docs/architecture.png
```

Recommended structure:

```
Frontend (React)
      │
      ▼
API Gateway (Node / Express)
        │
 ┌──────┼─────────┬────────────────┐
 ▼      ▼         ▼                ▼

TiDB  OpenAI  AWS Polly  Google Drive

      │
      ▼
PPDRIVE Storage
```

### Diagram Tools (Recommended)

Professional tools commonly used for system architecture diagrams:

- Excalidraw
- Lucidchart
- Figma
- Draw.io

These tools allow you to create clean architecture diagrams suitable for documentation, presentations, and technical portfolios.

---

# 📊 System Design

This section describes the high-level system design decisions behind Academic Binder.  
It is particularly useful for **technical interviews, portfolio evaluation, and engineering documentation**.

---

## Problem

Students need a **unified platform** capable of managing their academic workflow efficiently.

The system should allow users to:

- Manage structured study notes
- Store academic documents and media
- Generate study podcasts from notes
- Plan academic tasks and schedules

The goal is to provide an **AI-enhanced academic workspace** that centralizes all learning activities.

---

## Constraints

The platform must handle several technical constraints:

- Large file uploads (PDFs, audio, video)
- Real-time or near real-time audio processing
- Latency from external AI APIs
- Scalable storage for files and user data

These constraints influence architecture decisions related to **storage, processing, and scalability**.

---

## Solution

To address the problem and constraints, Academic Binder adopts the following architectural strategies.

### Architecture Decisions

| Decision | Reason |
|--------|--------|
| Distributed SQL Database | Enables horizontal scalability and high availability |
| External File Storage | Prevents database overload and improves performance |
| Asynchronous Audio Generation | Ensures responsive user experience during podcast generation |
| REST API Architecture | Provides simple, modular, and widely compatible backend services |

These decisions help ensure that the platform remains **scalable, responsive, and maintainable** as usage grows.

---
