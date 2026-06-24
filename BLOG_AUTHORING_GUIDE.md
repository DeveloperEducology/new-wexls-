# KlassChamp Blog Authoring Guide

This guide explains how to write, format, and publish new articles on the KlassChamp blog.

---

## 📂 Where Blog Files Live

All blog posts are plain text Markdown files (`.md`) located in:
`src/content/blog/`

To create a new post, simply create a new file in this directory (e.g., `fun-science-activities.md`). The file name determines the URL slug of the post (e.g., `https://klasschamp.com/blog/fun-science-activities`).

---

## 📝 Document Structure

Each blog post consists of two sections:
1. **Frontmatter (Metadata):** A configuration block at the very top of the file enclosed by `---` lines.
2. **Body (Markdown):** The actual article text formatted in Markdown.

### Complete Example File

```markdown
---
title: '5 Fun Science Activities for Early Learners'
date: '2026-06-19'
description: 'Engage LKG and UKG children with hands-on experiments covering states of matter, sorting, and density.'
category: 'Science'
author: 'KlassChamp Team'
---

Hands-on science experiments are key to building early reasoning skills. Children learn best when they can touch, pour, and observe changes.

Here are three simple, visual experiments to try at home or in class:

### 1. Water Density (Sink or Float)
Fill a container with water. Gather common items like a metal spoon, plastic toy, coin, wood block, and leaf. Have students predict which will sink and which will float before dropping them in.

### 2. Magic Milk (Surface Tension)
Pour milk into a shallow dish, add drops of food coloring, and dip a cotton swab in dish soap. Touch the milk with the soapy swab and watch the colors instantly burst outward!

### 3. DIY Lava Lamp (States of Matter)
Fill a jar with vegetable oil, add water, and drop in food coloring. Drop in half of an effervescent tablet (like Alka-Seltzer) and watch colorful carbon dioxide bubbles rise and fall.
```

---

## 🏷️ Metadata Field Reference

The dynamic parser recognizes the following fields inside the `---` block:

| Field | Required | Type | Description |
| :--- | :---: | :---: | :--- |
| **`title`** | Yes | String | The main headline of your article. |
| **`date`** | Yes | String | Format: `YYYY-MM-DD`. Used to sort posts chronologically. |
| **`description`** | Yes | String | A 1-2 sentence preview summary shown in the blog post card. |
| **`category`** | No | String | Categorization tag (e.g., `Math`, `Science`, `Parent Tips`). |
| **`author`** | No | String | The name of the writer (defaults to `KlassChamp Team` if omitted). |

---

## 🎨 Formatting Tips

The blog supports standard Markdown formatting:
* **Headers:** Use `##` for main sections and `###` for sub-sections.
* **Lists:** Use `*` or `-` for bulleted lists, and `1.` for numbered lists.
* **Bold/Italics:** Wrap text in `**bold**` or `*italics*`.
* **Paragraph Spacing:** Leave a blank line between paragraphs to ensure proper text separation.

---

## 🖼️ Placing Images and SVGs

To embed images or vector SVGs inside your articles:

1. **Store the Files:** Place all visual assets (PNGs, JPEGs, SVGs) in the public folder, under:
   `public/images/` or `public/images/blog/`

2. **Embed in Markdown:** Use standard Markdown image syntax with the relative path starting from the public root (`/` maps to `public/`):
   `![Descriptive Alt Text](/images/blog/my-diagram.svg)`
   
   *Example PNG:*
   `![Water Experiment Example](/images/blog/water-experiment.png)`

   *Example Vector SVG:*
   `![Geometry Shapes Graph](/images/blog/shapes.svg)`

The blog rendering engine automatically styles all images with centered block alignment, modern rounded corners (`border-radius: 8px`), responsive scaling (`max-width: 100%`), and smooth shadows.

### 👥 Side-by-Side Images (Uniform Grid Layout)

To place two or more images side-by-side on the same row with equal widths and matching heights:

Wrap the standard Markdown image elements inside a `:::grid` container block:

```markdown
:::grid
![Visual Activity 1](/images/blog/activity1.png)
![Visual Activity 2](/images/blog/activity2.png)
:::
```

* **Uniform Height:** The engine automatically sets images inside a grid to a uniform height (`220px`) and uses `object-fit: cover` to crop them neatly without distortion, keeping the row balanced.
* **Auto-Scaling Columns:** On larger screens, they align side-by-side. On mobile screens, they automatically stack vertically to fit the viewport width.

---

### 📏 Setting Manual Widths on Images

If you do not want an image to take up the full column width (`100%`), you can specify a manual size:

#### Method A: Space + Equal Suffix (Markdown)
Add a space and `=[width]` (e.g. `300px` or `50%`) inside the url parentheses at the end of the image path:

```markdown
![Logo](/images/logo.png =300px)
![Chart](/images/chart.svg =60%)
```

#### Method B: Raw HTML `<img>` Tag
You can also write standard HTML image tags directly. The parser automatically permits and renders them:

```html
<img src="/images/logo.png" style="width: 300px; display: block; margin: 0 auto;" />
```

---

### 🔢 Image Multipliers (Repeating Images)

If you need to show the exact same image repeatedly (e.g., repeating a "book" or "cookie" icon 5 times for a math counting exercise), you can use our multiplier shortcut.

Add `* [number]` after your manual width settings inside the url parentheses:

```markdown
![Book](https://example.com/book.png =50px * 5)
```

The engine automatically duplicates and renders the image 5 times side-by-side! This saves you from copying and pasting long URLs repeatedly.

You can also use this inside a grid block to lay them out:

```markdown
:::grid
![Book](https://example.com/book.png =50px * 5)
:::
```
