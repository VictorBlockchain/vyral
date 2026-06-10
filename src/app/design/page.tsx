'use client';

import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/Card';

export default function DesignNotesPage() {
  return (
    <AppLayout>
      <section className="page-section">
        <h1 className="display-1">Design Notes</h1>
        <p className="mb-lg">
          Detailed specifications for AI replication and developer handoff.
        </p>

        <Card className="mb-lg">
          <h3 className="h3">Theme Philosophy</h3>
          <p>
            The theme is "Pixar-Like" / "Pop-Art". It uses thick, hard borders (no
            blur shadows) to create a playful, tangible feel. Colors are high saturation
            and "natural".
          </p>
        </Card>

        <div className="grid-2 mb-lg">
          <Card>
            <h3 className="h3">Color Palette</h3>
            <p className="body-sm">Hex values are typically divisible by 3.</p>

            <div style={{ marginTop: '15px' }}>
              <div className="color-swatch" style={{ background: '#33CCFF' }}></div>
              <strong>Primary (Sky Blue)</strong>
              <br />
              <code>#33CCFF</code>
            </div>
            <div style={{ marginTop: '15px' }}>
              <div className="color-swatch" style={{ background: '#FF6699' }}></div>
              <strong>Secondary (Hot Pink)</strong>
              <br />
              <code>#FF6699</code>
            </div>
            <div style={{ marginTop: '15px' }}>
              <div className="color-swatch" style={{ background: '#FFCC33' }}></div>
              <strong>Accent (Sunny Yellow)</strong>
              <br />
              <code>#FFCC33</code>
            </div>
            <div style={{ marginTop: '15px' }}>
              <div className="color-swatch" style={{ background: '#33CC66' }}></div>
              <strong>Success (Fresh Green)</strong>
              <br />
              <code>#33CC66</code>
            </div>
          </Card>

          <Card>
            <h3 className="h3">Typography</h3>
            <p>
              <strong>Headings:</strong> Fredoka (Round, Friendly)
            </p>
            <p>
              <strong>Body:</strong> Nunito (Clean, Readable)
            </p>

            <div className="mt-md">
              <p>Display 1: 2.5rem (Mobile) / 3.5rem (Desktop)</p>
              <p>Display 2: 2rem</p>
              <p>H3: 1.5rem</p>
              <p>Body: 1rem (Base)</p>
            </div>
          </Card>
        </div>

        <Card className="mb-lg">
          <h3 className="h3">Spacing (Golden Ratio)</h3>
          <div className="grid-3">
            <div>
              <strong>XS</strong>: 4px
            </div>
            <div>
              <strong>SM</strong>: 8px
            </div>
            <div>
              <strong>MD</strong>: 16px
            </div>
            <div>
              <strong>LG</strong>: 24px
            </div>
            <div>
              <strong>XL</strong>: 40px
            </div>
          </div>
        </Card>

        <Card className="mb-lg">
          <h3 className="h3">Core CSS Variables</h3>
          <div className="code-block">
            <pre>{`:root {
    /* Borders */
    --border-thick: 3px solid #2D2D2D;

    /* Shadows (Hard Offset, No Blur) */
    --shadow-hard: 5px 5px 0px #2D2D2D;
    --shadow-hard-hover: 7px 7px 0px #2D2D2D;

    /* Radius */
    --radius-md: 16px;
    --radius-lg: 24px;
}`}</pre>
          </div>
        </Card>

        <Card>
          <h3 className="h3">Special Components</h3>
          <ul style={{ marginLeft: '20px', lineHeight: 2 }}>
            <li>
              <strong>Tilt Cards:</strong> Use 3D perspective transform on mousemove.
            </li>
            <li>
              <strong>Buttons:</strong> Add 'translate(2px, 2px)' on active state to
              simulate being pressed down.
            </li>
            <li>
              <strong>Blobs:</strong> Fixed position, z-index -1, high blur (80px), slow
              float animation.
            </li>
          </ul>
        </Card>
      </section>
    </AppLayout>
  );
}
