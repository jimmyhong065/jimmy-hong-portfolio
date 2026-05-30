import '@testing-library/jest-dom'

// ProseMirror / TipTap requires these browser APIs not fully in jsdom
if (!global.document.createRange) {
  global.document.createRange = () => ({
    setStart: () => {},
    setEnd: () => {},
    commonAncestorContainer: {
      nodeName: 'BODY',
      ownerDocument: document,
    },
    getBoundingClientRect: () => ({ top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 }),
    getClientRects: () => [],
  })
}

if (!global.window.getSelection) {
  global.window.getSelection = () => ({
    addRange: () => {},
    removeAllRanges: () => {},
    rangeCount: 0,
    getRangeAt: () => null,
  })
}

Element.prototype.scrollIntoView = () => {}
