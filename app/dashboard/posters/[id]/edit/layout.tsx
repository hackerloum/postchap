/**
 * Bare layout for the poster editor route.
 * Overrides the parent dashboard layout so the full-screen Fabric.js editor
 * is not wrapped in the DashboardNav shell.
 */
export default function PosterEditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
