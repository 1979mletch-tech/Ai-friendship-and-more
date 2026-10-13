import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installBootRecovery, showBootFailure } from './bootRecovery'

describe('bootRecovery', () => {
  let elementsById: Record<string, any>
  let createdElements: any[]
  let fakeRoot: any
  const originalDocument = (globalThis as any).document
  const originalWindow = (globalThis as any).window

  beforeEach(() => {
    elementsById = {}
    createdElements = []
    fakeRoot = {
      id: 'root',
      children: [] as any[],
      replaceChildren: vi.fn((...nodes: any[]) => {
        fakeRoot.children = nodes
      }),
    }
    elementsById['root'] = fakeRoot

    const fakeDocument = {
      getElementById: vi.fn((id: string) => elementsById[id] ?? null),
      createElement: vi.fn((tag: string) => {
        const el: any = {
          tagName: tag.toUpperCase(),
          attributes: {} as Record<string, string>,
          children: [] as any[],
          textContent: '',
          setAttribute: vi.fn((key: string, val: string) => {
            el.attributes[key] = val
          }),
          getAttribute: vi.fn((key: string) => el.attributes[key] ?? null),
          addEventListener: vi.fn(),
          append: vi.fn((...nodes: any[]) => {
            el.children.push(...nodes)
          }),
          querySelector: vi.fn((selector: string) => {
            if (selector === 'h1') return el.children.find((c: any) => c.tagName === 'H1') ?? null
            if (selector === 'p') return el.children.find((c: any) => c.tagName === 'P') ?? null
            if (selector === 'button') return el.children.find((c: any) => c.tagName === 'BUTTON') ?? null
            return null
          }),
        }
        Object.defineProperty(el, 'id', {
          get: () => el._id ?? '',
          set: (v: string) => {
            el._id = v
            elementsById[v] = el
          },
        })
        createdElements.push(el)
        return el
      }),
    }

    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: fakeDocument,
    })
  })

  afterEach(() => {
    if (originalDocument === undefined) {
      delete (globalThis as any).document
    } else {
      Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: originalDocument,
      })
    }
    if (originalWindow === undefined) {
      delete (globalThis as any).window
    } else {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: originalWindow,
      })
    }
    vi.restoreAllMocks()
  })

  it('renders startup recovery panel into root', () => {
    showBootFailure()
    const panel = elementsById['aurora-boot-failure']
    expect(panel).toBeDefined()
    expect(panel.getAttribute('role')).toBe('alert')
    expect(panel.querySelector('h1')?.textContent).toBe('Aurora could not start')
    expect(panel.querySelector('p')?.textContent).toBe('A loading problem occurred. Please reload Aurora.')
    const button = panel.querySelector('button')
    expect(button?.textContent).toBe('Reload Aurora')
    expect(fakeRoot.replaceChildren).toHaveBeenCalledWith(panel)
  })

  it('is idempotent when called multiple times', () => {
    showBootFailure()
    const firstCount = createdElements.length
    showBootFailure()
    expect(createdElements.length).toBe(firstCount)
  })

  it('does nothing when root element is not found', () => {
    delete elementsById['root']
    expect(() => showBootFailure()).not.toThrow()
    expect(elementsById['aurora-boot-failure']).toBeUndefined()
  })

  it('installs error and unhandledrejection handlers on window', () => {
    const fakeWindow = {
      addEventListener: vi.fn(),
    } as unknown as Window

    installBootRecovery(fakeWindow)
    expect(fakeWindow.addEventListener).toHaveBeenCalledWith('error', expect.any(Function))
    expect(fakeWindow.addEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function))
  })
})
