# WEXLS Practice Layout and Typography Refactoring Notes

The practice question interface has been refactored to align closely with IXL's clean, left-aligned, information-dense, and highly responsive design system.

---

## Key Refactoring Enhancements

### 1. Default Left-Alignment
- Changed the main practice container `.questionFocus` alignment in `FactoryLayout.module.css` from centered (`align-items: center; justify-content: center;`) to stretch and left-aligned (`align-items: stretch; justify-content: flex-start;`).
- Set default align-items for `FillInTheBlankRenderer` and `MCQRenderer` to `flex-start` and adjusted the gap from `22px` to a tighter `14px`.
- Configured default alignments inside `PartRenderer.js` for text, image, and SVG blocks to align left by default instead of center.

### 2. Smaller, Responsive Typography
- **Main Prompts (`h2`)**: Reduced default font weight from `900` to `700`, and set responsive font-sizing to `clamp(20px, 5vw, 26px)` (down from `28px` fallback) to prevent giant bold headers.
- **Story/Body Text (`TextPart`)**: Reduced default font-weight from `800` to a clean `500`. Scale font sizes responsively using `responsivePx(part.style?.fontSize, 18, 24)` (down from `28px` fallback).

### 3. Compact Equations & Inputs
- **KaTeX Equations (`latex`)**: Handled inline block and inline styles dynamically. Block equations render inline-block when part style displays inline, preventing block margins and allowing side-by-side positioning with inputs.
- **Input Blanks**: Scaled down input boxes to match the compact IXL inputs. Sizing is now `clamp(60px, 15vw, 84px)` width and `clamp(34px, 9vw, 42px)` height (down from 132px / 50px). Changed border radius to a tighter `4px` and border to `1.5px solid #94a3b8` (down from `12px` and `2px solid #93c5fd`).

### 4. Responsive MCQ Options Grid System
- Replaced the inline-calculated grid configurations in `MCQRenderer.js` with a robust CSS Grid class configuration:
  - **Single Column (`.optionsGridSingleColumn`)**: Used for long text choices (> 35 characters).
  - **Visual Grid (`.optionsGridVisual`)**: Responsive auto-fit layout using `grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr))` with a `16px` gap.
  - **Text Grid (`.optionsGridText`)**: Auto-fit text options using `minmax(min(220px, 100%), 1fr)`.
  - **Compact Grid (`.optionsGridCompact`)**: Tighter layout for very short labels (<= 8 characters) using `minmax(min(120px, 100%), 1fr)`.
- Applied a media query forcing `grid-template-columns: 1fr !important` and reduced option paddings on viewports under `760px` to guarantee zero horizontal overflows.
- Refactored option buttons styling to feature modern hover/selection effects with lighter default weights.

### 5. Responsive Visual SVGs
- Appended a global CSS Modules selector `.questionCard :global(svg)` inside `FactoryLayout.module.css` to enforce a responsive `max-width: 100%; height: auto;` rule across all interactive models and cube trains, solving any potential clipping on smaller mobile screen widths.

---

## Layout Comparison Summary

| Metric | Previous State | New State (Refactored) |
| :--- | :--- | :--- |
| **Card Padding** | `34px 40px 36px` | `24px 28px 26px` (Desktop) / `16px 14px 18px` (Mobile) |
| **Question Alignment** | Centered | Left-aligned (starts upper-left of card) |
| **Default Prompt Weight** | `900` / Bold | `700` / Medium-Bold |
| **Default Body Weight** | `800` / Heavy | `500` / Normal-Medium |
| **Equation Block Style** | Forced Block (Centers/Huge spacing) | Inline-aware (Left-aligned & compact) |
| **MCQ Options layout** | Hardcoded grid/column counts | Dynamic CSS grid based on character length & media |
| **Mobile Option Layout** | Side-by-side (Horizontal overflow risk) | Stacks into a clean 1-column layout |
| **Blank Input Radius / Border**| `12px` / `2px` | `4px` / `1.5px` |

---

## Verifications Performed

### 1. Desktop & Mobile Layout Inspections
- **Fractions Page (`/practice?subject=math&topic=fractions&skill=fractions-g5-add-subtract-unlike-denominators`)**: Checked and verified stacked fraction strip models, inline LaTeX equations, compact input sizes, and left-aligned headers.
- **Addition Page (`/practice?subject=math&topic=addition&skill=addition-g1-q5-word-sentence-to-10`)**: Inspected word problem layout with cubes SVGs, text margins, and verify buttons on both screen configurations.
- Verified that smart-score updates, level tracking, and prerequisite checks are completely unaffected.

### 2. Compilation and Code Health
- Executed production checks (`npm run build`) which succeeded with no errors or lint warnings.
