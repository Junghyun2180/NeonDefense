"""
타워 스프라이트 재정렬 — 화이트리스트 방식.

지정된 타워의 콘텐츠를 alpha-weighted centroid 기준으로 캔버스 가운데에 배치.
필요 시 축소해서 여백 확보.

원본은 Saved/_pre_clean_backup/towers/ 에 백업.
"""
from PIL import Image
import numpy as np
import os
import shutil

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TOWERS_DIR = os.path.join(ROOT, 'assets', 'towers')
BACKUP_DIR = os.path.join(ROOT, 'Saved', '_pre_clean_backup', 'towers')

# 처리 대상: (element, tier, scale, target_anchor)
# scale: 콘텐츠 축소 비율 (1.0 = 원본, 0.95 = 5% 축소)
# target_anchor: 'weighted' (alpha 무게중심) 또는 'bbox' (bounding box 중심)
TARGETS = [
    ('water', 1, 0.92, 'weighted'),
]

CANVAS_SIZE = 256


def recenter(elem, tier, scale, anchor):
    path = os.path.join(TOWERS_DIR, elem, f't{tier}.png')
    if not os.path.exists(path):
        return f'{elem}/t{tier}: NOT FOUND'

    img = Image.open(path).convert('RGBA')
    arr = np.array(img)
    alpha = arr[:, :, 3]
    binary = alpha > 32
    ys, xs = np.where(binary)
    if len(ys) == 0:
        return f'{elem}/t{tier}: empty'

    # bbox와 weighted center 계산
    bbox = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    if anchor == 'weighted':
        yy, xx = np.indices(alpha.shape)
        total = alpha.sum()
        cx = (xx * alpha).sum() / total
        cy = (yy * alpha).sum() / total
    else:
        cx = (bbox[0] + bbox[2]) / 2
        cy = (bbox[1] + bbox[3]) / 2

    # 백업
    os.makedirs(BACKUP_DIR, exist_ok=True)
    backup_path = os.path.join(BACKUP_DIR, f'{elem}_t{tier}.png')
    if not os.path.exists(backup_path):
        shutil.copy2(path, backup_path)

    # 1. bbox 영역만 크롭
    cropped = img.crop(bbox)
    cw, ch = cropped.size

    # 2. 축소 적용
    new_w = int(cw * scale)
    new_h = int(ch * scale)
    if new_w < 1 or new_h < 1:
        return f'{elem}/t{tier}: scale too small'
    scaled = cropped.resize((new_w, new_h), Image.LANCZOS)

    # 3. anchor 기준의 콘텐츠 좌표 (cropped 안에서)
    anchor_in_crop_x = cx - bbox[0]
    anchor_in_crop_y = cy - bbox[1]
    # scale 적용 후 anchor 위치
    anchor_scaled_x = anchor_in_crop_x * scale
    anchor_scaled_y = anchor_in_crop_y * scale

    # 4. 256 캔버스에 배치 — anchor가 (128, 128)이 되도록
    new_canvas = Image.new('RGBA', (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    paste_x = int(round(CANVAS_SIZE / 2 - anchor_scaled_x))
    paste_y = int(round(CANVAS_SIZE / 2 - anchor_scaled_y))
    new_canvas.paste(scaled, (paste_x, paste_y), scaled)

    new_canvas.save(path)

    return (f'{elem}/t{tier}: recentered '
            f'anchor={anchor}({cx:.0f},{cy:.0f}) → (128,128), '
            f'scale={scale}, crop=({cw}x{ch})→({new_w}x{new_h}), '
            f'paste=({paste_x},{paste_y})')


print('=== 타워 스프라이트 재정렬 ===')
for elem, tier, scale, anchor in TARGETS:
    print(recenter(elem, tier, scale, anchor))
