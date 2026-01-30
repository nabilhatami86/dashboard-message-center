import { createServer } from "http";
import { parse } from "url";
import next from "next";
import os from "os";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = process.env.PORT || 9999;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Get all network interfaces
function getNetworkInterfaces() {
  const nets = os.networkInterfaces();
  const results = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal (localhost) and non-IPv4 addresses
      const familyV4Value = typeof net.family === "string" ? "IPv4" : 4;
      if (net.family === familyV4Value && !net.internal) {
        results.push({
          name: name,
          address: net.address,
        });
      }
    }
  }

  return results;
}

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  })
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(
        "\x1b[36m" +
          `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ███╗   ██╗███████╗██╗  ██╗████████╗     ██╗███████╗                       ║
║   ████╗  ██║██╔════╝╚██╗██╔╝╚══██╔══╝     ██║██╔════╝                       ║
║   ██╔██╗ ██║█████╗   ╚███╔╝    ██║        ██║███████╗                       ║
║   ██║╚██╗██║██╔══╝   ██╔██╗    ██║        ██║╚════██║                       ║
║   ██║ ╚████║███████╗██╔╝ ██╗   ██║        ██║███████║                       ║
║   ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝   ╚═╝        ╚═╝╚══════╝                       ║
║                                                                              ║
║                🚀  N E X T . J S   D A S H B O A R D   S T A R T U P          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
` +
          "\x1b[0m",
      );

      // Time info
      const now = new Date();
      console.log(`⏰ Started at: ${now.toLocaleString("id-ID")}`);

      // Project info
      console.log(`\n📦 Project: Dashboard Message Center`);
      console.log(`📂 Working Directory: ${process.cwd()}`);
      console.log(`🔧 Environment: ${dev ? "Development" : "Production"}`);
      console.log(`⚡ Mode: Turbopack ${dev ? "Enabled" : "Disabled"}`);

      // Network interfaces
      console.log(`\n🌐 AVAILABLE NETWORK INTERFACES:`);
      console.log(`   ├─ Local:     http://localhost:${port}`);
      console.log(`   ├─ Local:     http://127.0.0.1:${port}`);

      const interfaces = getNetworkInterfaces();
      if (interfaces.length > 0) {
        interfaces.forEach((iface, index) => {
          const isLast = index === interfaces.length - 1;
          const prefix = isLast ? "   └─" : "   ├─";
          console.log(`${prefix} ${iface.name.padEnd(10)}: http://${iface.address}:${port}`);
        });
      } else {
        console.log(`   └─ No external network interfaces found`);
      }

      // API Configuration
      console.log(`\n🔌 API BACKEND:`);
      console.log(`   ├─ Base URL: http://localhost:8000`);
      console.log(`   └─ WebSocket: Enabled`);

      // Features
      console.log(`\n✨ FEATURES:`);
      console.log(`   ├─ Hot Reload: Enabled`);
      console.log(`   ├─ Fast Refresh: Enabled`);
      console.log(`   ├─ TypeScript: Enabled`);
      console.log(`   ├─ ESLint: Configured`);
      console.log(`   ├─ Tailwind CSS: v4`);
      console.log(`   └─ Server Actions: Enabled (2mb limit)`);

      // Pages
      console.log(`\n📄 AVAILABLE PAGES:`);
      const pages = [
        { path: "/login", desc: "Login page" },
        { path: "/dashboard-admin", desc: "Admin dashboard" },
        { path: "/dashboard-admin-monitoring", desc: "Monitoring dashboard" },
        { path: "/dashboard-agent", desc: "Agent dashboard" },
        { path: "/dashboard-agent-queue", desc: "Agent ticket queue" },
      ];

      pages.forEach((page, index) => {
        const isLast = index === pages.length - 1;
        const prefix = isLast ? "   └─" : "   ├─";
        console.log(`${prefix} ${page.path.padEnd(30)} → ${page.desc}`);
      });

      console.log(`\n${"=".repeat(80)}`);
      console.log("✅ READY TO ACCEPT CONNECTIONS");
      console.log("=".repeat(80) + "\n");
    });
});
