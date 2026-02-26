import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import ErrorBoundary from './error-boundary'

const meta: Meta<typeof ErrorBoundary> = {
  component: ErrorBoundary,
}

export default meta

type Story = StoryObj<typeof ErrorBoundary>

const ThrowError = () => {throw new Error('Some error')}

const Fallback = () => (
  <div>
    Something happened <button className="rounded-sm border border-gray-700 px-2 py-0.5 text-sm">Retry</button>
  </div>
)

export const WithError: Story = {
  render: () => (
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  )
}

export const CustomFallback: Story = {
  render: () => (
    <ErrorBoundary fallback={<Fallback />}>
      <ThrowError />
    </ErrorBoundary>
  )
}
