"""
Saved/src/{element}.png 의 2×2 그리드 (T1~T4) 자산을 잘라서
배경 제거 → 256x256 캔버스에 가운데 배치 → assets/towers/{element}/t{1-4}.png 저장.

배치 순서: 좌상=T1, 우상=T2, 좌하=T3, 우하=T4

배경 제거: 4 코너의 평균색을 배경색으로 잡고, 그 색과 거리 < TOL인 픽셀 중
           코너에서 connected 된 영역만 alpha=0 처리 (가운데 타워 보호).
"""
from PIL import Image
import numpy as np
from scipy import ndimage
import os
import shutil

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC_DIR = os.path.join(ROOT, 'Saved', 'src')
TOWERS_DIR = os.path.join(ROOT, 'assets', 'towers')
BACKUP_DIR = os.path.join(ROOT, 'Saved', '_pre_import_backup', 'towers')

TARGETS = ['water', 'electric', 'wind']

CANVAS_SIZE = 256
BG_TOLERANCE = 35   # 배경색 매칭 거리 (RGB Euclidean)
ALPHA_THRESHOLD = 32  # 콘텐츠 bbox 계산용

os.makedirs(BACKUP_DIR, exist_ok=True)


def remove_background(img):
    """4 코너에서 floodfill 방식으로 배경 영역만 transparent 처리."""
    arr = np.array(img.convert('RGBA'))
    rgb = arr[:, :, :3].astype(int)
    h, w = arr.shape[:2]

    # 4코너 평균을 배경색 후보로
    corners = np.array([rgb[0, 0], rgb[0, -1], rgb[-1, 0], rgb[-1, -1]])
    bg = corners.mean(axis=0)

    # 배경색에 가까운 픽셀
    diff = np.sqrt(((rgb - bg) ** 2).sum(axis=2))
    candidate = diff < BG_TOLERANCE

    # 코너와 연결된 영역만 진짜 배경
    labeled, _ = ndimage.label(candidate)
    corner_labels = {
        int(labeled[0, 0]),
        int(labeled[0, -1]),
        int(labeled[-1, 0]),
        int(labeled[-1, -1]),
    }
    corner_labels.discard(0)
    bg_mask = np.isin(labeled, list(corner_labels))

    arr[bg_mask, 3] = 0
    return Image.fromarray(arr), int(bg_mask.sum()), tuple(int(c) for c in bg)


def fit_to_canvas(tile_img):
    """alpha bbox로 크롭 후 256x256 캔버스 가운데에 배치 (필요 시 축소)."""
    arr = np.array(tile_img.convert('RGBA'))
    alpha = arr[:, :, 3]
    binary = alpha > ALPHA_THRESHOLD
    ys, xs = np.where(binary)
    if len(ys) == 0:
        return Image.new('RGBA', (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))

    bbox = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    cropped = tile_img.crop(bbox)
    cw, ch = cropped.size

    # 캔버스에 들어가도록 리사이즈 (여백 8px씩)
    max_w = CANVAS_SIZE - 16
    max_h = CANVAS_SIZE - 16
    scale = min(max_w / cw, max_h / ch, 1.0)
    new_w = int(round(cw * scale))
    new_h = int(round(ch * scale))
    if scale < 1.0:
        cropped = cropped.resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new('RGBA', (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    paste_x = (CANVAS_SIZE - new_w) // 2
    paste_y = (CANVAS_SIZE - new_h) // 2
    canvas.paste(cropped, (paste_x, paste_y), cropped)

    return canvas


def slice_2x2(img):
    """이미지를 2x2 그리드로 분할. 좌상=T1, 우상=T2, 좌하=T3, 우하=T4."""
    w, h = img.size
    half_w, half_h = w // 2, h // 2
    return [
        ('t1', img.crop((0, 0, half_w, half_h))),
        ('t2', img.crop((half_w, 0, w, half_h))),
        ('t3', img.crop((0, half_h, half_w, h))),
        ('t4', img.crop((half_w, half_h, w, h))),
    ]


report = []
for elem in TARGETS:
    src_path = os.path.join(SRC_DIR, f'{elem}.png')
    if not os.path.exists(src_path):
        report.append(f'{elem}: SOURCE NOT FOUND ({src_path})')
        continue

    src_img = Image.open(src_path)
    cleaned, removed_px, bg_color = remove_background(src_img)
    report.append(f'{elem}: bg={bg_color}, removed {removed_px}px from sheet')

    for tier_name, tile in slice_2x2(cleaned):
        out_path = os.path.join(TOWERS_DIR, elem, f'{tier_name}.png')
        # 백업
        backup_path = os.path.join(BACKUP_DIR, f'{elem}_{tier_name}.png')
        if os.path.exists(out_path) and not os.path.exists(backup_path):
            shutil.copy2(out_path, backup_path)

        final = fit_to_canvas(tile)
        final.save(out_path)
        # 알파 통계
        a = np.array(final)[:, :, 3]
        ys, xs = np.where(a > 32)
        if len(ys) > 0:
            cy = (ys.min() + ys.max()) / 2
            cx = (xs.min() + xs.max()) / 2
            report.append(
                f'  {tier_name}: bbox=({xs.min()},{ys.min()})-({xs.max()},{ys.max()}), '
                f'center=({cx:.0f},{cy:.0f}), area={int((a>32).sum())}px'
            )

print('=== 타워 시트 임포트 결과 ===')
print('\n'.join(report))
