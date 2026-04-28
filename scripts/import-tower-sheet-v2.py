"""Import tower sheets from Saved/src with cleaner background removal and visual centering.

Saved/src/{element}.png 의 2x2 그리드(T1~T4)에서 타워 본체를 깔끔히 추출한다.
- 배경: 명도(luma) 임계치 + edge 부터의 floodfill 로 광범위하게 제거
- 작은 잔여 검정/밝은 점은 connected component 분석으로 제거 (큰 컴포넌트만 유지)
- 알파 가중 무게중심을 캔버스 중심에 맞춤 (작은 글로우 잔영에 흔들리지 않음)
"""
from PIL import Image
import numpy as np
import os
import shutil

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC_DIR = os.path.join(ROOT, 'Saved', 'src')
TOWERS_DIR = os.path.join(ROOT, 'assets', 'towers')
BACKUP_DIR = os.path.join(ROOT, 'Saved', '_pre_v2_backup', 'towers')

TARGETS = ['water', 'electric', 'wind']
CANVAS_SIZE = 256

LUMA_BG_MAX = 50          # 이 명도 이하는 배경 후보 (검정 톤)
MIN_COMPONENT_AREA = 200   # 이 픽셀 미만의 잔여 컴포넌트 제거
ALPHA_FOR_CENTROID = 80    # 무게중심 계산용 알파 임계치


def luma(rgb: np.ndarray) -> np.ndarray:
    """Rec. 601 luminance approximation."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return 0.299 * r + 0.587 * g + 0.114 * b


def remove_background(rgb_img: Image.Image) -> Image.Image:
    """배경 제거 → RGBA 반환."""
    arr = np.array(rgb_img.convert('RGB')).astype(int)
    h, w = arr.shape[:2]

    bg_mask = luma(arr) < LUMA_BG_MAX  # 어두운 영역 = 배경 후보

    # edge 에서 floodfill 처럼 connected 영역만 진짜 배경으로 인정
    from collections import deque
    is_bg = np.zeros((h, w), dtype=bool)
    visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if bg_mask[y, x] and not visited[y, x]:
                q.append((y, x)); visited[y, x] = True
    for y in range(h):
        for x in (0, w - 1):
            if bg_mask[y, x] and not visited[y, x]:
                q.append((y, x)); visited[y, x] = True
    while q:
        y, x = q.popleft()
        is_bg[y, x] = True
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and bg_mask[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))

    # 결과 RGBA — 배경 = alpha 0, 나머지 = alpha 255 (점진적 페이드 추가)
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[..., :3] = arr.astype(np.uint8)
    # 배경이 아닌 픽셀의 alpha 는 명도 기반으로 살짝 페이드 (검정 잔여 살리지 않도록)
    L = luma(arr)
    fade = np.clip((L - LUMA_BG_MAX) / 30.0, 0.0, 1.0)
    alpha = np.where(is_bg, 0.0, 255 * fade + 255 * (L >= LUMA_BG_MAX + 30))
    alpha = np.clip(alpha, 0, 255).astype(np.uint8)
    rgba[..., 3] = alpha
    return Image.fromarray(rgba, 'RGBA')


def keep_largest_component(rgba: Image.Image, min_area: int = MIN_COMPONENT_AREA) -> Image.Image:
    """알파 채널 기준 connected component 중 작은 잔여물 제거."""
    from scipy import ndimage  # 이미 사용중인 라이브러리

    arr = np.array(rgba)
    mask = arr[..., 3] > 0
    labeled, n = ndimage.label(mask)
    if n == 0:
        return rgba
    sizes = np.bincount(labeled.ravel())
    sizes[0] = 0  # 배경
    # 면적이 min_area 미만인 컴포넌트는 제거
    keep = sizes >= min_area
    keep[0] = False
    valid_mask = keep[labeled]
    arr[..., 3] = np.where(valid_mask, arr[..., 3], 0)
    return Image.fromarray(arr, 'RGBA')


def slice_2x2(img: Image.Image):
    w, h = img.size
    half_w, half_h = w // 2, h // 2
    return [
        ('t1', img.crop((0, 0, half_w, half_h))),
        ('t2', img.crop((half_w, 0, w, half_h))),
        ('t3', img.crop((0, half_h, half_w, h))),
        ('t4', img.crop((half_w, half_h, w, h))),
    ]


def fit_to_canvas_centered(tile: Image.Image) -> Image.Image:
    """타일을 256x256 으로 맞춤 + 알파 가중 무게중심을 캔버스 중심에 정렬."""
    arr = np.array(tile)
    a = arr[..., 3]
    ys, xs = np.where(a > 0)
    if len(ys) == 0:
        return Image.new('RGBA', (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))

    # 1) 알파 bbox 로 거친 크롭
    x0, y0 = xs.min(), ys.min()
    x1, y1 = xs.max() + 1, ys.max() + 1
    cropped = tile.crop((x0, y0, x1, y1))
    cw, ch = cropped.size

    # 2) 크기 맞춤 (max 240, 여백 8px)
    max_side = CANVAS_SIZE - 16
    scale = min(max_side / cw, max_side / ch, 1.0)
    if scale < 1.0:
        new_w = int(round(cw * scale))
        new_h = int(round(ch * scale))
        cropped = cropped.resize((new_w, new_h), Image.LANCZOS)

    # 3) bbox 중심 기준으로 한번 가운데 정렬
    canvas = Image.new('RGBA', (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    cw, ch = cropped.size
    px = (CANVAS_SIZE - cw) // 2
    py = (CANVAS_SIZE - ch) // 2
    canvas.paste(cropped, (px, py), cropped)

    # 4) 무게중심(알파>80) → 캔버스 중심 보정
    arr2 = np.array(canvas)
    a2 = arr2[..., 3].astype(float)
    mask = a2 > ALPHA_FOR_CENTROID
    if mask.any():
        ys, xs = np.where(mask)
        weights = a2[mask]
        cx = (xs * weights).sum() / weights.sum()
        cy = (ys * weights).sum() / weights.sum()
        dx = round(CANVAS_SIZE / 2 - cx)
        dy = round(CANVAS_SIZE / 2 - cy)
        if dx != 0 or dy != 0:
            shifted = Image.new('RGBA', (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
            shifted.paste(canvas, (dx, dy), canvas)
            canvas = shifted

    return canvas


def main():
    os.makedirs(BACKUP_DIR, exist_ok=True)
    report = []
    for elem in TARGETS:
        src_path = os.path.join(SRC_DIR, f'{elem}.png')
        if not os.path.exists(src_path):
            report.append(f'{elem}: SOURCE NOT FOUND')
            continue
        src = Image.open(src_path)
        cleaned = remove_background(src)
        cleaned = keep_largest_component(cleaned, min_area=400)
        report.append(f'{elem}: cleaned + components filtered')

        for name, tile in slice_2x2(cleaned):
            # 각 타일에서도 작은 컴포넌트 제거 (인접 타일 잔여물)
            tile = keep_largest_component(tile, min_area=MIN_COMPONENT_AREA)
            out = fit_to_canvas_centered(tile)
            out_path = os.path.join(TOWERS_DIR, elem, f'{name}.png')
            backup_path = os.path.join(BACKUP_DIR, f'{elem}_{name}.png')
            if os.path.exists(out_path) and not os.path.exists(backup_path):
                shutil.copy2(out_path, backup_path)
            out.save(out_path)

            # 검증: 무게중심 오프셋
            arr = np.array(out)
            a = arr[..., 3].astype(float)
            mask = a > ALPHA_FOR_CENTROID
            if mask.any():
                ys, xs = np.where(mask)
                w = a[mask]
                cx = (xs * w).sum() / w.sum()
                cy = (ys * w).sum() / w.sum()
                dx = CANVAS_SIZE / 2 - cx
                dy = CANVAS_SIZE / 2 - cy
                report.append(f'  {name}: centroid offset ({dx:+.2f},{dy:+.2f}), opaque area={int(mask.sum())}px')

    print('=== 추출 + 정렬 결과 ===')
    print('\n'.join(report))


if __name__ == '__main__':
    main()
