import os
from PIL import Image
import subprocess
import sys

PHOTOS_DIR = "photos"
MAX_SIZE = 2000          # pixeli pe latura lungă
JPEG_QUALITY = 80        # calitate JPEG (0-100), 80 e foarte bun

def resize_image(filepath):
    """Redimensionează imaginea dacă e mai mare decât MAX_SIZE și o salvează ca JPEG."""
    try:
        img = Image.open(filepath)
        # Nu modifica dacă imaginea e deja mai mică
        if max(img.size) <= MAX_SIZE:
            print(f"Sărit (deja mică): {filepath}")
            return

        # Redimensionează păstrând proporțiile
        img.thumbnail((MAX_SIZE, MAX_SIZE), Image.Resampling.LANCZOS)

        # Salvează ca JPEG (convertește și PNG, BMP etc.)
        new_filepath = os.path.splitext(filepath)[0] + ".jpg"
        # Dacă numele se schimbă, șterge vechiul fișier (opțional)
        img.convert("RGB").save(new_filepath, "JPEG", quality=JPEG_QUALITY, optimize=True)
        if new_filepath != filepath:
            os.remove(filepath)
        print(f"Redimensionat: {filepath} -> {new_filepath} (dimensiune finală: {max(img.size)})")
    except Exception as e:
        print(f"Eroare la {filepath}: {e}")

def compress_video(filepath):
    """Comprimă un fișier video la 720p cu ffmpeg (dacă este instalat)."""
    output_path = filepath + ".compressed.mp4"
    cmd = [
        "ffmpeg", "-y", "-i", filepath,
        "-vf", "scale=-2:720",   # 720p, ajustează automat înălțimea
        "-c:v", "libx264", "-crf", "28",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        output_path
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        # Înlocuiește originalul cu versiunea comprimată
        os.replace(output_path, filepath)
        print(f"Video comprimat: {filepath}")
    except FileNotFoundError:
        print(f"ATENȚIE: ffmpeg nu este instalat. Video-ul {filepath} nu a fost comprimat.")
    except subprocess.CalledProcessError:
        print(f"Eroare la comprimarea video: {filepath}")

if __name__ == "__main__":
    # Verifică dacă există folderul photos
    if not os.path.exists(PHOTOS_DIR):
        print(f"Folderul '{PHOTOS_DIR}' nu există!")
        sys.exit(1)

    # Parcurge toate fișierele recursiv
    for root, dirs, files in os.walk(PHOTOS_DIR):
        for f in files:
            full_path = os.path.join(root, f)
            ext = f.lower()
            if ext.endswith(('.jpg', '.jpeg', '.png', '.bmp', '.tiff')):
                resize_image(full_path)
            elif ext.endswith(('.mp4', '.mov', '.avi', '.mkv')):
                compress_video(full_path)
            else:
                print(f"Sărit (tip necunoscut): {full_path}")

    print("\nToate operațiile s-au terminat.")