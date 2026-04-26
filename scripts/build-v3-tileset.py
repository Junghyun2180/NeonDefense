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
def extract_node(cross_arr, rh, rv):
    """cross.png의 중앙에서 node 원형 + glow만 추출 (주변 rail은 제외).
    중심에서 일정 반경 안의 픽셀만 alpha로 뽑아냄."""
    H, W = cross_arr.shape[:2]
    cx, cy = W // 2, H // 2
    # node 반경 추정: 노드 코어가 충분히 들어가는 정도. cross 중앙에 원형 노드가 있다는 가정.
    # 안전한 반경: conduit 폭의 ~25%
    cv0, cv1 = rv
    ch0, ch1 = rh
    node_r = min(cv1 - cv0, ch1 - ch0) // 4  # 약 conduit의 1/4
    yy, xx = np.ogrid[:H, :W]
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    # 부드러운 원형 마스크 (반경 안쪽은 1, 바깥은 0, 가장자리 페이드)
    fade = 6
    mask = np.clip((node_r + fade - dist) / fade, 0, 1)
    return mask  # shape (H, W), 0~1


def fill_body_strip(out, cv0, cv1, ch0, ch1, source_arr, axis='vertical'):
    """중앙 junction을 source_arr의 conduit body (rail 제외)로 채움."""
    # source_arr는 str-v 또는 str-h. axis='vertical'이면 str-v를 쓰고,
    # 중앙 부분의 conduit body를 sampling해서 junction 영역 (cv0..cv1, ch0..ch1)에 채움.
    if axis == 'vertical':
        # str-v의 가운데 col에서 conduit body 영역 (rail 사이)을 sampling
        body = source_arr[ch0:ch1, cv0:cv1].copy()
    else:
        body = source_arr[ch0:ch1, cv0:cv1].copy()
    out[ch0:ch1, cv0:cv1] = body
    return out


def make_corner(connect_top, connect_bottom, connect_left, connect_right,
                rail_v, rail_h, with_node=True):
    """
    합성 규칙 (직각 코너):
    - 수직 leg: connect_top/bottom에 따라 str_v 일부 paste
    - 수평 leg: connect_left/right에 따라 str_h 일부 paste
    - 중앙 junction: cross 전체가 아닌 case별로 처리
      · 코너(2-edge): str_v body로 채운 후 node만 원형 alpha 합성
      · T(3-edge), cross(4-edge): cross 그대로 사용 (rail 4방향 다 필요)
    """
    out = np.full((TILE, TILE, 4), BASE, dtype=np.uint8)

    cv0, cv1 = rail_v
    ch0, ch1 = rail_h
    n_connections = sum([connect_top, connect_bottom, connect_left, connect_right])
    is_corner = (n_connections == 2 and (connect_top != connect_bottom) and
                 (connect_left != connect_right))

    # 수직 conduit 범위
    v_top = 0 if connect_top else ch0
    v_bot = TILE if connect_bottom else ch1
    # 수평 conduit 범위
    h_left = 0 if connect_left else cv0
    h_right = TILE if connect_right else cv1

    # 수직 leg
    if connect_top or connect_bottom:
        out[v_top:v_bot, cv0:cv1] = straight_v[v_top:v_bot, cv0:cv1]

    # 수평 leg
    if connect_left or connect_right:
        out[ch0:ch1, h_left:h_right] = straight_h[ch0:ch1, h_left:h_right]

    # 중앙 junction 처리
    if is_corner:
        # 코너: 중앙은 str_v의 body로 채운 뒤 모서리 처리 (안쪽 rail 컷오프)
        # 1) body 재충전: 중앙 junction의 모든 픽셀을 str_v의 conduit body로 덮어
        out[ch0:ch1, cv0:cv1] = straight_v[ch0:ch1, cv0:cv1]
        # 2) horizontal leg가 가져온 horizontal-rail 흔적이 중앙 junction에 남음.
        #    위 덮어쓰기로 horizontal leg의 rail은 사라짐. 그러나 horizontal leg는
        #    out[ch0:ch1, h_left:h_right]로 paint되어 중앙 junction의 rail은 위에서 덮였음.
        # 3) 이제 outer L-rail(닫힌 방향의 반대편)을 다시 그어야 함.
        #    예: ┗(top+right)에서 outer L = LEFT-of-vertical + BOTTOM-of-horizontal
        #    이 두 rail은 이미 leg paste로 그려져 있고, 중앙 junction에서 끊어지지 않음.
        #    하지만 inner L-rail (RIGHT-of-vertical, TOP-of-horizontal)은
        #    원래는 inner corner까지만 그어져야 하는데, leg paste로 인해 중앙
        #    전체로 그어짐. 위에서 body로 덮어버려서 사라짐. 그런데 outer L도 일부
        #    덮였을 수 있음 → 다시 복원.

        # 먼저 outer L-rail 복원: 닫힌 방향과 반대편의 rail을 leg에서 다시 가져와 중앙에 paste
        rail_thick = 12  # rail 두께 추정 (rail 6px + glow 6px)

        # ┗ : outer L = LEFT(vertical 좌측) + BOTTOM(horizontal 하단)
        # ┛ : outer L = RIGHT(vertical 우측) + BOTTOM
        # ┏ : outer L = LEFT + TOP
        # ┓ : outer L = RIGHT + TOP

        if connect_top and connect_right:  # ┗
            # LEFT rail of vertical (cols cv0..cv0+rail_thick) — extend through center
            out[ch0:ch1, cv0:cv0 + rail_thick] = straight_v[ch0:ch1, cv0:cv0 + rail_thick]
            # BOTTOM rail of horizontal (rows ch1-rail_thick..ch1) — extend through center
            out[ch1 - rail_thick:ch1, cv0:cv1] = straight_h[ch1 - rail_thick:ch1, cv0:cv1]
        elif connect_top and connect_left:  # ┛
            out[ch0:ch1, cv1 - rail_thick:cv1] = straight_v[ch0:ch1, cv1 - rail_thick:cv1]
            out[ch1 - rail_thick:ch1, cv0:cv1] = straight_h[ch1 - rail_thick:ch1, cv0:cv1]
        elif connect_bottom and connect_right:  # ┏
            out[ch0:ch1, cv0:cv0 + rail_thick] = straight_v[ch0:ch1, cv0:cv0 + rail_thick]
            out[ch0:ch0 + rail_thick, cv0:cv1] = straight_h[ch0:ch0 + rail_thick, cv0:cv1]
        elif connect_bottom and connect_left:  # ┓
            out[ch0:ch1, cv1 - rail_thick:cv1] = straight_v[ch0:ch1, cv1 - rail_thick:cv1]
            out[ch0:ch0 + rail_thick, cv0:cv1] = straight_h[ch0:ch0 + rail_thick, cv0:cv1]

        # 4) 중앙 노드 원형만 cross에서 추출해서 alpha 합성
        if with_node:
            mask = extract_node(cross_arr, rail_h, rail_v)  # (H, W) 0~1
            mask3 = mask[:, :, None]
            blended = (mask3 * cross_arr.astype(float) +
                       (1 - mask3) * out.astype(float)).astype(np.uint8)
            out = blended
    else:
        # T 또는 cross: cross 그대로 사용 (모든 방향에 rail이 있어야 함)
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
