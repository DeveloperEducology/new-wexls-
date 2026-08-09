import os
from PIL import Image

input_dir = 'public/jnvst2025_clean_pages'
output_dir = 'public/jnvst2025_clean_pages'

page_files = [f for f in sorted(os.listdir(input_dir)) if f.startswith('page-') and f.endswith('.png')]

cleaned_images = []

for filename in page_files:
    filepath = os.path.join(input_dir, filename)
    img = Image.open(filepath).convert('RGB')
    
    # Load pixels
    pixels = img.load()
    width, height = img.size
    
    # Process pixels: Strip watermark and stray light marks
    # Dark black text and diagram lines have low R, G, B values (e.g., R < 110, G < 110, B < 110)
    # Light grey watermarks like "www.eenadupratibha.net" and grey paper noise have high R, G, B values (> 110)
    # Stray red ink ticks have high Red relative to Green & Blue
    
    out_img = Image.new('RGB', (width, height), (255, 255, 255))
    out_pixels = out_img.load()
    
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            
            # Check for dark printed black lines/text
            is_dark = (r < 110 and g < 110 and b < 110)
            
            # Check for red ink marks (red channel noticeably higher than green/blue)
            is_red_ink = (r > 130 and r > g + 30 and r > b + 30)
            
            # Check for blue ink marks
            is_blue_ink = (b > 130 and b > r + 30 and b > g + 20)
            
            if is_dark and not is_red_ink and not is_blue_ink:
                # Keep crisp dark printed stroke
                out_pixels[x, y] = (0, 0, 0)
            else:
                # Turn background, watermark, and stray pen marks to pure white
                out_pixels[x, y] = (255, 255, 255)
                
    clean_name = filename.replace('page-', 'clean_page_')
    clean_path = os.path.join(output_dir, clean_name)
    out_img.save(clean_path, 'PNG', quality=100)
    cleaned_images.append(out_img)
    print(f"Processed & saved clean image: {clean_name}")

# Convert all 10 cleaned pages into a clean A4 PDF file
if cleaned_images:
    pdf_path = 'public/JNVST_2025_Class6_Clean_Pages2-11.pdf'
    cleaned_images[0].save(
        pdf_path, 'PDF', resolution=200.0, save_all=True, append_images=cleaned_images[1:]
    )
    print(f"Generated clean A4 PDF: {pdf_path}")
