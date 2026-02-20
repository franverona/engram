export default function LayoutInnerContent({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="px-4 pt-6 pb-16">
      {children}
    </div>
  )
}
