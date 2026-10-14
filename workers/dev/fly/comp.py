import sys
from PIL import Image
# comp.py OUT cols W H img1 img2 ...
out, cols, W, H = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]); fs = sys.argv[5:]
rows = (len(fs) + cols - 1) // cols; s = Image.new('RGB', (cols * W, rows * H))
for i, f in enumerate(fs): s.paste(Image.open(f).resize((W, H)), ((i % cols) * W, (i // cols) * H))
s.save(out)
