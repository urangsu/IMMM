from PIL import Image, ImageDraw, ImageFont
import os

# Create base images
def create_image(filename, width, height, is_og=False, maskable=False, app_icon=False):
    # Background
    bg_color = (252, 252, 250) # Clean Cotton #FCFCFA
    
    # Text color
    text_color = (26, 26, 31) # Ink #1A1A1F
    pink_color = (217, 136, 147) # Pink #D98893
    
    if app_icon:
        img = Image.new('RGB', (width, height), bg_color)
    else:
        img = Image.new('RGBA', (width, height), bg_color)
        
    draw = ImageDraw.Draw(img)
    
    if is_og:
        # Draw OG Image
        # Left text
        draw.text((100, 200), "IMMM", fill=text_color, font=None, anchor="ls") # Pillow default font is small, but it's just a placeholder without real fonts
        draw.rectangle([100, 250, 400, 260], fill=pink_color)
        draw.text((100, 320), "내 손 안의 네컷 포토부스", fill=text_color)
        draw.text((100, 360), "설치 없이 브라우저에서 바로", fill=text_color)
        
        # Right mockup placeholder
        draw.rectangle([700, 100, 950, 530], outline=text_color, width=4)
        for i in range(4):
            draw.rectangle([720, 120 + i*100, 930, 200 + i*100], fill=(220, 220, 220))
    else:
        # Draw Icon
        center_x = width // 2
        center_y = height // 2
        
        # Safe area for maskable
        if maskable:
            safe_radius = int(width * 0.3)
            draw.ellipse([center_x - safe_radius, center_y - safe_radius, 
                          center_x + safe_radius, center_y + safe_radius], outline=(230, 230, 230), width=2)
            
        # Draw IMMM text (simple representation)
        text_w = int(width * 0.4)
        text_h = int(height * 0.1)
        draw.rectangle([center_x - text_w//2, center_y - text_h, center_x + text_w//2, center_y], fill=text_color)
        
        # Draw pink line
        draw.rectangle([center_x - text_w//2, center_y + 10, center_x + text_w//2, center_y + 10 + int(height * 0.02)], fill=pink_color)

    img.save(filename)
    print(f"Generated {filename}")

if __name__ == "__main__":
    create_image("og.png", 1200, 630, is_og=True)
    create_image("icon-192.png", 192, 192)
    create_image("icon-512.png", 512, 512)
    create_image("icon-maskable-512.png", 512, 512, maskable=True)
    create_image("app-icon-1024.png", 1024, 1024, app_icon=True)
