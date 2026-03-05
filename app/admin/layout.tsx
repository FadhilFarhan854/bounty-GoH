export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Hide root navigation on admin pages */}
      <style>{`
        nav, [data-nav="main"] { display: none !important; }
      `}</style>
      {children}
    </>
  );
}
