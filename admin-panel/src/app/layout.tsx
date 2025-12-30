import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UPSC Prep Admin Panel',
  description: 'Admin panel for managing UPSC Prep application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

