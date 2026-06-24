'use client';

export default function PrintButton() {
  return (
    <button
      className="print-action-btn"
      onClick={() => window.print()}
    >
      🖨️ Print This Sheet
    </button>
  );
}
