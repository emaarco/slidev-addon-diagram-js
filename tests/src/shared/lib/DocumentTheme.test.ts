import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { type EffectScope, effectScope, nextTick } from 'vue'

import type { DiagramThemeName } from '../../../../src/shared/lib/DiagramTheme'
import { DocumentTheme } from '../../../../src/shared/lib/DocumentTheme'

describe('DocumentTheme', () => {
  let scope: EffectScope

  function resolve(pinnedName: () => DiagramThemeName | undefined = () => undefined) {
    return scope.run(() => new DocumentTheme(pinnedName).name)!
  }

  beforeEach(() => {
    scope = effectScope()
  })

  afterEach(() => {
    scope.stop()
    document.documentElement.classList.remove('dark')
  })

  it('is light while <html> has no dark class', () => {
    expect(resolve().value).toBe('light')
  })

  it('is dark while <html> has the dark class', () => {
    document.documentElement.classList.add('dark')

    expect(resolve().value).toBe('dark')
  })

  it('follows the dark class when it is toggled', async () => {
    const name = resolve()

    document.documentElement.classList.add('dark')
    await nextTick()
    expect(name.value).toBe('dark')

    document.documentElement.classList.remove('dark')
    await nextTick()
    expect(name.value).toBe('light')
  })

  it('keeps a pinned theme regardless of the document', async () => {
    const name = resolve(() => 'light')

    document.documentElement.classList.add('dark')
    await nextTick()

    expect(name.value).toBe('light')
  })

  it('stops following the document once its scope is disposed', async () => {
    const name = resolve()
    scope.stop()

    document.documentElement.classList.add('dark')
    await nextTick()

    expect(name.value).toBe('light')
  })
})
