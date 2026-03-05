export default function PortalLayout({ children }: { children: React.ReactNode }) {
  // No auth required — access is controlled by portal token
  return <>{children}</>;
}
