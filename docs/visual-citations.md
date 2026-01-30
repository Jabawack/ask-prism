# Visual Citations

One of Ask Prism's key features: click a citation to see exactly where the answer came from in the source PDF.

## The Problem

Traditional document Q&A systems return page-level citations:

```
"Q3 revenue was $4.2 million (Source: Page 7)"
```

**Problems:**
- Page 7 might have 500+ words
- User has to scan to find the relevant text
- No visual confirmation the answer is correct
- Easy for LLM to hallucinate page numbers

## The Solution

Bounding box citations that highlight the exact text:

```
┌─────────────────────┐     ┌─────────────────────────────────┐
│  Chat Response      │     │  PDF Viewer                     │
│                     │     │                                 │
│  "Q3 revenue was    │     │  Page 7                         │
│   $4.2M [1]"        │────▶│  ┌─────────────────────────┐    │
│                     │     │  │ ████ Q3: $4.2M ████████ │    │
│  Click [1] to see   │     │  └─────────────────────────┘    │
│  source location    │     │                                 │
└─────────────────────┘     └─────────────────────────────────┘
```

---

## How It Works

### 1. Forge Prism Extracts Bounding Boxes

When Forge Prism parses a document, it stores coordinates for every chunk:

```typescript
{
  content: "Q3 revenue was $4.2 million, up 15%...",
  bbox: {
    x: 10,      // 10% from left
    y: 45,      // 45% from top
    width: 80,  // 80% of page width
    height: 8,  // 8% of page height
    page: 7
  }
}
```

### 2. Ask Prism Stores Bbox with Chunks

```sql
CREATE TABLE document_chunks (
  id UUID,
  content TEXT,
  bbox JSONB,  -- { x, y, width, height, page }
  ...
);
```

### 3. Citations Include Bbox

When generating a response, the LLM cites chunks by ID. We then look up the bbox:

```typescript
const citation = {
  marker: "[1]",
  chunk_id: "chunk_abc123",
  page: 7,
  bbox: { x: 10, y: 45, width: 80, height: 8 },
  text: "Q3 revenue was $4.2 million, up 15%..."
};
```

### 4. PDF Viewer Renders Highlight

Using `react-pdf` + `react-pdf-highlighter-extended`:

```typescript
<PDFViewer
  url={documentUrl}
  highlights={[
    {
      id: "cite-1",
      position: {
        pageIndex: 6,  // 0-indexed
        boundingRect: {
          x1: 10, y1: 45,
          x2: 90, y2: 53,  // x + width, y + height
        }
      }
    }
  ]}
/>
```

---

## Coordinate System

Bounding boxes use **percentage-based coordinates** (0-100):

```
┌─────────────────────────────────────────┐
│ (0,0)                            (100,0)│
│                                         │
│          ┌─────────────┐                │
│          │   bbox      │                │
│          │ x=10, y=45  │                │
│          │ w=80, h=8   │                │
│          └─────────────┘                │
│                                         │
│ (0,100)                        (100,100)│
└─────────────────────────────────────────┘
```

**Why percentages?**
- Works at any zoom level
- No conversion needed when PDF scale changes
- Consistent across different PDF viewers

**Converting to pixels:**
```typescript
const pixelBbox = {
  x: (bbox.x / 100) * pageWidth,
  y: (bbox.y / 100) * pageHeight,
  width: (bbox.width / 100) * pageWidth,
  height: (bbox.height / 100) * pageHeight
};
```

---

## Frontend Components

### PDFViewer Component

```typescript
// src/components/pdf/PDFViewer.tsx

interface PDFViewerProps {
  url: string;
  highlights: Highlight[];
  onHighlightClick?: (id: string) => void;
}

function PDFViewer({ url, highlights, onHighlightClick }: PDFViewerProps) {
  return (
    <Document file={url}>
      {pages.map((page, index) => (
        <Page
          key={index}
          pageNumber={index + 1}
          renderAnnotationLayer
        >
          <HighlightLayer
            highlights={highlights.filter(h => h.page === index + 1)}
            onHighlightClick={onHighlightClick}
          />
        </Page>
      ))}
    </Document>
  );
}
```

### HighlightLayer Component

```typescript
// src/components/pdf/HighlightLayer.tsx

interface HighlightLayerProps {
  highlights: Highlight[];
  pageWidth: number;
  pageHeight: number;
}

function HighlightLayer({ highlights, pageWidth, pageHeight }: HighlightLayerProps) {
  return (
    <div className="highlight-layer">
      {highlights.map(h => (
        <div
          key={h.id}
          className="highlight-box"
          style={{
            position: 'absolute',
            left: `${h.bbox.x}%`,
            top: `${h.bbox.y}%`,
            width: `${h.bbox.width}%`,
            height: `${h.bbox.height}%`,
            backgroundColor: 'rgba(255, 235, 59, 0.4)',
            border: '2px solid #FFC107'
          }}
        />
      ))}
    </div>
  );
}
```

### Citation Click Flow

```typescript
// In chat component
const handleCitationClick = (citation: Citation) => {
  // 1. Set active highlight
  setActiveHighlights([{
    id: citation.marker,
    bbox: citation.bbox,
    page: citation.page
  }]);

  // 2. Scroll PDF to page
  pdfViewerRef.current?.scrollToPage(citation.page);

  // 3. Flash the highlight
  highlightRef.current?.animate([
    { opacity: 0.4 },
    { opacity: 0.8 },
    { opacity: 0.4 }
  ], { duration: 500, iterations: 2 });
};
```

---

## Citation Format

### In Response Text

```
"Q3 revenue was $4.2 million [1], representing a 15% increase [2]."
```

### Citation Data Structure

```typescript
interface Citation {
  marker: string;      // "[1]"
  chunk_id: string;    // "chunk_abc123"
  page: number;        // 7
  bbox: BoundingBox;   // { x, y, width, height }
  text: string;        // "Q3 revenue was $4.2 million..."
  confidence: number;  // 0.98
  verified: boolean;   // true
}
```

### Message with Citations

```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}
```

---

## Edge Cases

### Multi-Page Tables

Tables spanning pages have multiple bboxes:

```typescript
{
  content: "Holdings table (continued from page 5)",
  bbox: [
    { page: 5, x: 10, y: 50, width: 80, height: 45 },
    { page: 6, x: 10, y: 10, width: 80, height: 60 }
  ]
}
```

### Merged Chunks

When chunks are merged during retrieval:

```typescript
// Show all contributing bboxes
const highlight = {
  id: "cite-1",
  boxes: [
    { page: 3, x: 10, y: 20, width: 80, height: 10 },
    { page: 3, x: 10, y: 32, width: 80, height: 8 }
  ]
};
```

### Rotated PDFs

Forge Prism handles rotation during parsing, so bboxes are always relative to the correctly oriented page.

---

## Libraries Used

| Library | Purpose |
|---------|---------|
| `react-pdf` | PDF rendering |
| `react-pdf-highlighter-extended` | Highlight overlay |
| `pdfjs-dist` | Core PDF parsing |

---

## Related Documents

- [Architecture](./architecture.md) - System overview
- [RAG Pipeline](./rag-pipeline.md) - How citations are generated
