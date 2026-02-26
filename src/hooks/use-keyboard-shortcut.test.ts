// @vitest-environment jsdom

import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useKeyboardShortcut } from './use-keyboard-shortcut'

describe('useKeyboardShortcut', () => {
  afterEach(() => {
    document.querySelectorAll('input').forEach((input) => document.body.removeChild(input))
  })

  it('ignores callback if wrong keys are pressed', () => {
    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut({
      callback,
      key: 'A',
    }))

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }))
    expect(callback).not.toHaveBeenCalled()
  })

  it('ignores callback when right key is pressed but not the provided modifiers ', () => {
    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut({
      callback,
      key: 'A',
      meta: true,
    }))

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    expect(callback).not.toHaveBeenCalled()
  })

  it('calls callback for keys with no modifier', () => {
    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut({
      callback,
      key: 'A',
    }))

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    expect(callback).toHaveBeenCalled()
  })

  it('calls callback for keys with Ctrl modifier', () => {
    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut({
      callback,
      key: 'A',
      ctrl: true,
    }))

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true }))
    expect(callback).toHaveBeenCalled()
  })

  it('calls callback for keys with Meta modifier', () => {
    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut({
      callback,
      key: 'A',
      meta: true,
    }))

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', metaKey: true }))
    expect(callback).toHaveBeenCalled()
  })

  it('calls callback for keys ignoring pressed modifiers', () => {
    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut({
      callback,
      key: 'A',
    }))

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', metaKey: true, ctrlKey: true }))
    expect(callback).toHaveBeenCalled()
  })

  it('calls callback for keys with both modifiers', () => {
    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut({
      callback,
      key: 'A',
      meta: true,
      ctrl: true,
    }))

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', metaKey: true, ctrlKey: true }))
    expect(callback).toHaveBeenCalled()
  })

  it('calls callback when input is focused and modifiers are required', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut({
      callback,
      key: 'A',
      ctrl: true,
    }))

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true }))
    expect(callback).toHaveBeenCalled()
  })

  it('ignores callback when input is focused', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut({
      callback,
      key: 'A',
    }))

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    expect(callback).not.toHaveBeenCalled()
  })

})
