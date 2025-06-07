import { Box, Container, Heading, Text, Button, VStack, HStack } from '@chakra-ui/react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <Box minH="100vh" bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
      <Container maxW="container.xl" py={20}>
        <VStack spacing={8} textAlign="center" color="white">
          <Box>
            <Heading size="2xl" mb={4}>
              🌙 Meoluna
            </Heading>
            <Text fontSize="xl" opacity={0.9}>
              Wo Lernen zu Entdecken wird
            </Text>
          </Box>
          
          <VStack spacing={6}>
            <Heading size="lg">
              Transformiere Klassenarbeiten in magische Lernwelten
            </Heading>
            <Text fontSize="lg" maxW="600px" opacity={0.8}>
              Jede Lernwelt ist ein einzigartiges Universum, thematisch perfekt abgestimmt 
              und als eigenständige Web-App erreichbar.
            </Text>
          </VStack>

          <HStack spacing={4}>
            <Button 
              as={Link}
              href="/create"
              size="lg" 
              colorScheme="purple"
              variant="solid"
            >
              Lernwelt erstellen
            </Button>
            <Button 
              as={Link}
              href="/gallery"
              size="lg" 
              variant="outline"
              color="white"
              borderColor="white"
              _hover={{ bg: 'whiteAlpha.200' }}
            >
              Galerie entdecken
            </Button>
          </HStack>

          <VStack spacing={4} pt={8}>
            <Text fontSize="md" opacity={0.7}>
              ✨ KI-generierte Inhalte • 🎨 Thematische Welten • 📊 Analytics Dashboard
            </Text>
          </VStack>
        </VStack>
      </Container>
    </Box>
  )
}