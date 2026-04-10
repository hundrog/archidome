Archidome
===

The Architect's Ledger for TTRPG Masters. A modern platform designed for Game Masters to manage campaigns, document chronicles, and collaborate on world-building projects.

Project Overview
---

Archidome is a centralized management tool for tabletop role-playing games. It provides "Architects" with total control over their narratives, supporting a wide range of systems from classic high fantasy to "Natural Fantasy" titles like Fabula Ultima and dark settings such as Symbaroum.

**Core Features:**

- Campaign Management: Track detailed session logs and recruitment statuses.
- Multi-Master Collaboration: Permission-based system to work alongside other GMs on shared projects.
- Automated Social Cards: Generate dynamic campaign images for sharing on Discord and other social platforms.
- Integrated Authentication: Secure and fast login via Discord and Google OAuth.

**Technical Stack:**

- Frontend: Nuxt 3 with Nuxt UI (Tailwind CSS)
- Backend: Supabase (PostgreSQL, Realtime, and Auth)
- Language: TypeScript for a type-safe development environment
- Image Processing: html-to-image for client-side card rendering

Getting Started
---

Clone the repository:

```bash
git clone https://github.com/your-username/Archidome.git
```

Install dependencies:

```bash
npm install
```

**Environment Setup:**
Create a .env file, add your supabase credentials (as described in their docs) and add your client_url

```javascript
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
NUXT_PUBLIC_CLIENT_URL=https://your-domain.xwz
```

Run the development server:

```bash
npm run dev
```

License
---

This project is licensed under the [Polyform Non-Commercial 1.0.0 license](https://polyformproject.org/licenses/noncommercial/1.0.0/).

Personal Use: You are free to use, modify, and fork this code for personal or community purposes.

Commercial Use: You may NOT use this software or its source code for commercial purposes (such as selling it as a service or charging for access) without explicit written consent from the author.

Credits
---

Developed by Oscar Recio. Designed for the TTRPG community and the Architects of worlds.
