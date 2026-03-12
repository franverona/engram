export default function LayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <main className="max-w-6xl m-auto">{children}</main>
}
