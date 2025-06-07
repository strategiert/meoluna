import { notFound } from 'next/navigation'
import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react'
import { meolunaQueries } from '@meoluna/database'

interface WorldPageProps {
  params: {
    subdomain: string
  }
}

export default async function WorldPage({ params }: WorldPageProps) {
  try {
    const world = await meolunaQueries.getWorldBySubdomain(params.subdomain)
    const content = await meolunaQueries.getWorldContent(world.id)

    return (
      <Box minH="100vh" bg={world.theme_config.colors?.background || 'gray.50'}>
        <Container maxW="container.xl" py={8}>
          <VStack spacing={8}>
            <Box textAlign="center">
              <Heading size="xl" mb={4} color={world.theme_config.colors?.primary}>
                {world.title}
              </Heading>
              <Text fontSize="lg" color="gray.600">
                Fach: {world.subject} {world.grade_level && `• Klasse ${world.grade_level}`}
              </Text>
            </Box>

            <VStack spacing={6} w="full">
              {content.map((item, index) => (
                <Box 
                  key={item.id}
                  p={6}
                  bg="white"
                  borderRadius="lg"
                  shadow="md"
                  w="full"
                >
                  <Heading size="md" mb={3}>
                    {item.title || `Inhalt ${index + 1}`}
                  </Heading>
                  <Text color="gray.600" mb={2}>
                    Typ: {item.content_type} • Schwierigkeit: {item.difficulty_level}/4
                  </Text>
                  {item.description && (
                    <Text>{item.description}</Text>
                  )}
                </Box>
              ))}
            </VStack>
          </VStack>
        </Container>
      </Box>
    )
  } catch (error) {
    console.error('Error loading world:', error)
    notFound()
  }
}