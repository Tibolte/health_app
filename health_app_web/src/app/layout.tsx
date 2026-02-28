import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Health App",
  description: "Training dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body {
                margin: 0;
                background: #0a0e1a;
                background-image:
                  radial-gradient(ellipse 80% 60% at 50% 0%, rgba(34,211,238,0.08) 0%, transparent 60%),
                  radial-gradient(ellipse 60% 50% at 80% 100%, rgba(167,139,250,0.06) 0%, transparent 50%);
                min-height: 100vh;
              }
              @keyframes cardEntrance {
                from { opacity: 0; transform: translateY(16px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .workout-card {
                animation: cardEntrance 0.5s ease-out both;
                animation-delay: calc(var(--card-index, 0) * 0.1s);
              }
              .workout-card:hover {
                transform: translateY(-2px);
                filter: brightness(1.15);
                transition: transform 0.15s ease, filter 0.15s ease;
              }
              .sync-button {
                transition: filter 0.15s ease, box-shadow 0.15s ease;
              }
              .sync-button:hover:not(:disabled) {
                filter: brightness(1.15);
                box-shadow: 0 0 20px rgba(34,211,238,0.3);
              }
              .stat-card {
                transition: filter 0.15s ease, box-shadow 0.15s ease;
              }
              .stat-card:hover {
                filter: brightness(1.1);
                box-shadow: 0 0 16px rgba(34,211,238,0.1);
              }
              @keyframes slideIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes shimmer {
                0% { opacity: 0.4; }
                50% { opacity: 0.8; }
                100% { opacity: 0.4; }
              }
              .skeleton-shimmer {
                animation: shimmer 1.5s ease-in-out infinite;
              }
              @keyframes progressGrow {
                from { width: 0%; }
              }
              .progress-fill {
                animation: progressGrow 0.8s ease-out both;
                animation-delay: 0.3s;
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
              .sync-spinner {
                animation: spin 0.8s linear infinite;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
