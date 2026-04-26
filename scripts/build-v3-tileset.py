"""
v3 타일셋 빌더.

전략:
- v3 batch에서 str-h, str-v, cross, grass는 conduit이 정중앙에 잘 위치 → 검은 테두리 제거 후 사용
- corner 4종 + T-junction 4종은 AI가 위치를 못 맞췄음 → 합성으로 만들어서 픽셀-퍼펙트 정렬
- 직각 디자인이므로 합성이 trivial: vertical/horizontal 직선의 일부 + 중앙 junction node

산출물: assets/tiles/path/{12 tiles}.png (각 512×512)
"""
from PIL import Image
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / 'Saved' / 'src' / 'v3_slices'
OUT_DIR = ROOT / 'assets' / 'tiles' / 'path'
TILE = 512
BASE = (10, 10, 31, 255)  # #0a0a1f

# ---------- 유틸 ----------
def content_box(arr):
    """검은 테두리 제거: brightness > 15인 픽셀의 bounding box."""
    if arr.shape[2] == 4:
        rgb = arr[..., :3]
    else:
        rgb = arr
    b = rgb.sum(axis=2)
    rows = np.where(b.max(axis=1) > 15)[0]
    cols = np.where(b.max(axis=0) > 15)[0]
    if len(rows) and len(cols):
        return cols.min(), rows.min(), cols.max() + 1, rows.max() + 1
    return 0, 0, arr.shape[1], arr.shape[0]


def load_and_clean(name):
    """검은 테두리 제거 + 512×512 리사이즈."""
    img = np.array(Image.open(SRC_DIR / f'{name}.png').convert('RGBA'))
    l, t, r, b = content_box(img)
    cropped = Image.fromarray(img[t:b, l:r])
    return cropped.resize((TILE, TILE), Image.LANCZOS)


def find_rails(line):
    """rails: line의 양 끝쪽 가까이에 있는 큰 밝기 클러스터 두 개를 찾는다."""
    if line.shape[1] == 4:
        line = line[:, :3]
    brightness = line.astype(int).sum(axis=1)
    bright = brightness > 350
    idx = np.where(bright)[0]
    if len(idx) == 0:
        return None
    gaps = np.diff(idx)
    splits = np.where(gaps > 30)[0]  # 큰 갭(rail 사이 빈 공간)으로 클러스터 분리
    clusters = np.split(idx, splits + 1) if len(splits) else [idx]
    # 각 클러스터의 평균 brightness로 점수 매겨서 가장 큰 두 개 선택
    cluster_scores = [(brightness[c].mean() * len(c), c.min(), c.max()) for c in clusters]
    cluster_scores.sort(reverse=True)  # 점수 높은 순
    if len(cluster_scores) < 2:
        return None
    top2 = cluster_scores[:2]
    spans = sorted([(s[1], s[2]) for s in top2])  # 위치 순으로 재정렬
    return spans


def detect_conduit_axis(img_arr, axis='horizontal'):
    """conduit이 어느 row/col 범위에 있는지 측정 (단일 직선 타일용)."""
    H, W = img_arr.shape[:2]
    # 여러 위치에서 측정해서 가장 일관된 결과 사용
    if axis == 'horizontal':  # str-h: rails are horizontal lines, scan vertically at mid col
        line = img_arr[:, W // 2]
    else:  # str-v: rails are vertical lines, scan horizontally at mid row
        line = img_arr[H // 2, :]
    rails = find_rails(line)
    if not rails or len(rails) < 2:
        return None
    # rail 두 개의 외곽 = conduit 가장자리
    return rails[0][0], rails[1][1]


# ---------- 1단계: 베이스 타일 정리 ----------
print('=== 1단계: 검은 테두리 제거 + 512×512 리사이즈 ===')
straight_h_pil = load_and_clean('str-h')
straight_v_pil = load_and_clean('str-v')
cross_pil = load_and_clean('cross')
grass_pil = load_and_clean('grass')

straight_h = np.array(straight_h_pil)
straight_v = np.array(straight_v_pil)
cross_arr = np.array(cross_pil)
grass_arr = np.array(grass_pil)

# rail 위치 측정
sh_rails = detect_conduit_axis(straight_h, 'horizontal')
sv_rails = detect_conduit_axis(straight_v, 'vertical')
print(f'  str-h rails (rows): {sh_rails}')
print(f'  str-v rails (cols): {sv_rails}')


# ---------- 2단계: 베이스 타일에서 conduit이 edge까지 닿도록 보정 ----------
def extend_to_edges(arr, axis='horizontal'):
    """직선 타일에서 conduit content가 edge까지 안 가면, 가장 안쪽 valid pixel column/row를 edge까지 복제."""
    out = arr.copy()
    H, W = arr.shape[:2]
    rgb_sum = arr[..., :3].sum(axis=2)
    if axis == 'horizontal':
        # 좌측: 첫 valid column 찾기
        col_max = rgb_sum.max(axis=0)
        valid_cols = np.where(col_max > 30)[0]
        if len(valid_cols):
            first, last = valid_cols.min(), valid_cols.max()
            # 좌측 0~first-1 채우기
            for x in range(0, first):
                out[:, x, :] = arr[:, first, :]
            for x in range(last + 1, W):
                out[:, x, :] = arr[:, last, :]
    else:  # vertical
        row_max = rgb_sum.max(axis=1)
        valid_rows = np.where(row_max > 30)[0]
        if len(valid_rows):
            first, last = valid_rows.min(), valid_rows.max()
            for y in range(0, first):
                out[y, :, :] = arr[first, :, :]
            for y in range(last + 1, H):
                out[y, :, :] = arr[last, :, :]
    return out


straight_h = extend_to_edges(straight_h, 'horizontal')
straight_v = extend_to_edges(straight_v, 'vertical')
cross_arr = extend_to_edges(extend_to_edges(cross_arr, 'horizontal'), 'vertical')
print('  → conduit이 edge까지 도달하도록 확장 완료')

# 보정 후 rail 위치 재측정
sh_rails = detect_conduit_axis(straight_h, 'horizontal')
sv_rails = detect_conduit_axis(straight_v, 'vertical')
print(f'  보정 후 str-h rails (rows): {sh_rails}')
print(f'  보정 후 str-v rails (cols): {sv_rails}')


# ---------- 3단계: corner / T 합성 ----------
def make_corner(connect_top, connect_bottom, connect_left, connect_right,
                rail_v, rail_h, with_node=True):
    """
    합성 규칙:
    - 수직 conduit 영역 (cols rail_v) × (rows: connect_top → 중앙 / 중앙 → connect_bottom)
    - 수평 conduit 영역 (rows rail_h) × (cols: connect_left → 중앙 / 중앙 → connect_right)
    - 중앙 junction (cols rail_v × rows rail_h) = cross (with node)
    - 그 외 = base
    """
    out = np.full((TILE, TILE, 4), BASE, dtype=np.uint8)

    cv0, cv1 = rail_v
    ch0, ch1 = rail_h
    mid = TILE // 2

    # 수직 conduit 범위
    v_top = 0 if connect_top else ch0  # 위로 닫혀있으면 중앙 정사각형까지만
    v_bot = TILE if connect_bottom else ch1

    # 수평 conduit 범위
    h_left = 0 if connect_left else cv0
    h_right = TILE if connect_right else cv1

    # 수직 leg 그리기
    if connect_top or connect_bottom:
        out[v_top:v_bot, cv0:cv1] = straight_v[v_top:v_bot, cv0:cv1]

    # 수평 leg 그리기
    if connect_left or connect_right:
        out[ch0:ch1, h_left:h_right] = straight_h[ch0:ch1, h_left:h_right]

    # 중앙 junction = cross (node 포함)
    if with_node:
        out[ch0:ch1, cv0:cv1] = cross_arr[ch0:ch1, cv0:cv1]

    return Image.fromarray(out)


# rail bounds 사용
RV = sv_rails  # cols where vertical conduit lives
RH = sh_rails  # rows where horizontal conduit lives

print(f'\n=== 2단계: 합성 시작 (RV={RV}, RH={RH}) ===')

tiles = {
    'grass': Image.fromarray(grass_arr),
    'str-h': Image.fromarray(straight_h),
    'str-v': Image.fromarray(straight_v),
    'cross': Image.fromarray(cross_arr),
    # corners (T/B/L/R 연결 여부)
    'cor-ne': make_corner(True, False, False, True, RV, RH),    # ┗
    'cor-nw': make_corner(True, False, True, False, RV, RH),    # ┛
    'cor-se': make_corner(False, True, False, True, RV, RH),    # ┏
    'cor-sw': make_corner(False, True, True, False, RV, RH),    # ┓
    # T-junctions
    't-n': make_corner(True, False, True, True, RV, RH),        # ┻ (top + L + R)
    't-s': make_corner(False, True, True, True, RV, RH),        # ┳ (bot + L + R)
    't-e': make_corner(True, True, False, True, RV, RH),        # ┣ (top + bot + R)
    't-w': make_corner(True, True, True, False, RV, RH),        # ┫ (top + bot + L)
}

# ---------- 4단계: 저장 ----------
print('\n=== 3단계: 저장 ===')
OUT_DIR.mkdir(parents=True, exist_ok=True)
# v2 백업이 이미 있으면 v3 백업도 남김
import shutil
v2_backup = OUT_DIR / '_v2_backup'
if not v2_backup.exists():
    v2_backup.mkdir()
    for f in OUT_DIR.glob('*.png'):
        shutil.copy(f, v2_backup / f.name)
    print(f'  v2 백업: {v2_backup}')

for name, img in tiles.items():
    out_path = OUT_DIR / f'{name}.png'
    img.save(out_path, optimize=True)
    print(f'  ✓ {name}.png')

print('\n✅ v3 타일셋 빌드 완료')
