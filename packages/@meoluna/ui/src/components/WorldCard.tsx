import { Box, Heading, Text, Badge, HStack, VStack, Button } from '@chakra-ui/react'
import { motion } from 'framer-motion'
// import { MeolunaWorld } from '@meoluna/database'

// Temporary inline type to avoid cross-package imports during build
interface MeolunaWorld {
  id: string
  subdomain: string
  title: string
  subject: string
  grade_level?: number
  theme_config: any
  play_count?: number
  avg_rating?: number
}

const MotionBox = motion(Box)

interface WorldCardProps {
  world: MeolunaWorld
  onVisit?: () => void
  onSave?: () => void
  showStats?: boolean
}

export function WorldCard({ world, onVisit, onSave, showStats = false }: WorldCardProps) {
  const themeConfig = world.theme_config as any

  return (
    <MotionBox
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Box
        p={6}
        borderRadius="2xl"
        bg="white"
        shadow="lg"
        border="1px solid"
        borderColor="gray.100"
        cursor="pointer"
        onClick={onVisit}
        _hover={{
          shadow: 'xl',
          borderColor: themeConfig?.colors?.primary || 'blue.300',
        }}
        position="relative"
        overflow="hidden"
      >
        {/* Theme-based background pattern */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          height="4px"
          bg={themeConfig?.colors?.primary || 'blue.500'}
        />

        <VStack align="start" spacing={4}>
          <VStack align="start" spacing={2} w="full">
            <HStack justify="space-between" w="full">
              <Badge
                colorScheme={getSubjectColor(world.subject)}
                variant="subtle"
                fontSize="xs"
                px={2}
                py={1}
                borderRadius="md"
              >
                {world.subject}
              </Badge>
              {world.grade_level && (
                <Badge variant="outline" fontSize="xs">
                  Klasse {world.grade_level}
                </Badge>
              )}
            </HStack>

            <Heading size="md" color="gray.800" noOfLines={2}>
              {world.title}
            </Heading>
          </VStack>

          {showStats && (
            <HStack spacing={4} fontSize="sm" color="gray.600">
              <Text>🎮 {world.play_count} Besucher</Text>
              {world.avg_rating && world.avg_rating > 0 && (
                <Text>⭐ {world.avg_rating.toFixed(1)}</Text>
              )}
            </HStack>
          )}

          <HStack spacing={2} w="full">
            <Button
              size="sm"
              variant="meoluna"
              onClick={(e) => {
                e.stopPropagation()
                onVisit?.()
              }}
              flex={1}
            >
              Entdecken
            </Button>
            {onSave && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  onSave()
                }}
              >
                💾
              </Button>
            )}
          </HStack>
        </VStack>
      </Box>
    </MotionBox>
  )
}

function getSubjectColor(subject: string): string {
  const colors: Record<string, string> = {
    mathematics: 'blue',
    biology: 'green',
    german: 'purple',
    history: 'orange',
    physics: 'gray',
    chemistry: 'red',
  }
  return colors[subject.toLowerCase()] || 'gray'
}