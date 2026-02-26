import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Spinner from './spinner'

const meta: Meta<typeof Spinner> = {
  component: Spinner,
}

export default meta

type Story = StoryObj<typeof Spinner>

export const DefaultSpinner: Story = {
  args: {
  },
}

export const CustomSizeSpinner: Story = {
  args: {
    size: 48
  },
}
