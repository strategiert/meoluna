import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ChakraProvider } from '@chakra-ui/react'
import { meolunaTheme } from '@meoluna/ui'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Meoluna - KI-Lernwelt Generator',
  description: 'Transformiere Klassenarbeiten in magische, interaktive Lernwelten',
  keywords: ['Bildung', 'KI', 'Lernwelten', 'Klassenarbeiten', 'interaktiv'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <ChakraProvider theme={meolunaTheme}>
          {children}
        </ChakraProvider>
      </body>
    </html>
  )
}