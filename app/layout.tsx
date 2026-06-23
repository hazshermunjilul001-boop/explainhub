import type { Metadata } from 'next'
import { Poppins, Inter } from 'next/font/google'
import Navbar from './components/Navbar'
import './globals.css'
import SupportButton from './components/SupportButton'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'ExplainHub',
  description: 'Explain it simply. Scroll until it clicks.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <body>
        <Navbar />
        <SupportButton />
        {children}
      </body>
    </html>
  )
}