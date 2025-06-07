import { Box, Text, HStack, VStack } from '@chakra-ui/react'
import { motion } from 'framer-motion'
// import { MeolunaThemeConfig } from '@meoluna/ai-core'

// Temporary inline type to avoid cross-package imports during build
interface MeolunaThemeConfig {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
  }
  patterns: {
    hero: string
    background: string
    decorative: string
  }
  animations: {
    entrance: string
    interaction: string
    success: string
  }
}

const MotionBox = motion(Box)

interface ThemePreviewProps {
  theme: MeolunaThemeConfig
  name: string
  isSelected?: boolean
  onClick?: () => void
}

export function ThemePreview({ theme, name, isSelected = false, onClick }: ThemePreviewProps) {
  return (
    <MotionBox
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Box
        p={4}
        borderRadius="xl"
        bg="white"
        shadow={isSelected ? 'lg' : 'md'}
        border="2px solid"
        borderColor={isSelected ? theme.colors.primary : 'gray.200'}
        cursor="pointer"
        onClick={onClick}
        _hover={{
          shadow: 'lg',
          borderColor: theme.colors.primary,
        }}
        position="relative"
        overflow="hidden"
      >
        {/* Background preview */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg={theme.colors.background}
          opacity={0.1}
        />

        <VStack spacing={3} position="relative" zIndex={1}>
          {/* Color palette */}
          <HStack spacing={2}>
            <Box
              w={6}
              h={6}
              borderRadius="full"
              bg={theme.colors.primary}
              border="2px solid white"
              shadow="sm"
            />
            <Box
              w={6}
              h={6}
              borderRadius="full"
              bg={theme.colors.secondary}
              border="2px solid white"
              shadow="sm"
            />
            <Box
              w={6}
              h={6}
              borderRadius="full"
              bg={theme.colors.accent}
              border="2px solid white"
              shadow="sm"
            />
          </HStack>

          {/* Theme name */}
          <Text
            fontSize="sm"
            fontWeight="bold"
            color={theme.colors.primary}
            textAlign="center"
          >
            {name}
          </Text>

          {/* Visual elements preview */}
          <HStack spacing={1} opacity={0.6}>
            <Text fontSize="xs" color="gray.600">
              {theme.patterns.hero}
            </Text>
          </HStack>
        </VStack>

        {/* Selection indicator */}
        {isSelected && (
          <Box
            position="absolute"
            top={2}
            right={2}
            w={4}
            h={4}
            borderRadius="full"
            bg={theme.colors.primary}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="xs" color="white" fontWeight="bold">
              ✓
            </Text>
          </Box>
        )}
      </Box>
    </MotionBox>
  )
}