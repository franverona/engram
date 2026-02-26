import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Kbd } from './kbd'

const meta: Meta<typeof Kbd> = {
  component: Kbd,
}

export default meta

type Story = StoryObj<typeof Kbd>

export const SingleKey: Story = {
  args: {
    keys: ['⌘'],
  },
}

export const ChordKey: Story = {
  args: {
    keys: ['⌘', 'K'],
  },
}
