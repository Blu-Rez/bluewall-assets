from PIL import Image
import sys
ks = ['shield', 'rally']; S = 256
im = Image.new('RGB', (S * 2 * 2 + 30, S + 20), (58, 85, 127))
for i, k in enumerate(ks):
    a = Image.open(f'abil/{k}.png').convert('RGBA'); im.paste(a, (10 + i * (S + 10), 10), a)
    b = a.resize((54, 54), Image.LANCZOS); im.paste(b, (2 * S + 30 + i * 70, 10), b)
im.save('abil/comp.png')
