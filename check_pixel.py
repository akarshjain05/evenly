from PIL import Image
img = Image.open("/Users/a91732/.gemini/antigravity/brain/f5aff53b-5a5d-47a6-af00-81e25dad169c/.user_uploaded/media_1789615850721.png")
print("Image size:", img.size)
print("Card color (approx 600, 500):", img.getpixel((img.size[0]//2, img.size[1]//2)))
print("Sidebar color (approx 100, 500):", img.getpixel((100, img.size[1]//2)))
print("Background color (approx 800, 500):", img.getpixel((img.size[0]-200, img.size[1]//2)))
