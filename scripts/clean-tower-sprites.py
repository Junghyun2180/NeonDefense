"""
타워 스프라이트 정리 (화이트리스트 방식).

사용자가 직접 확인한 의심 자산만 처리. 자동 식별은 light처럼
외곽 효과가 강한 타워에서 잘못된 결과를 낼 수 있어서 비활성.

새 의심 자산이 발견되면 TARGETS 리스트에 추가 후 재실행.

알고리즘:
1. alpha > THRESHOLD 픽셀로 이진화
2. 가장 큰 connected component를 메인으로 식별
3. 메인 마스크를 DILATE_PX 만큼 dilation (글로우/파편 포함 영역 확보)
4. dilation 영역 밖의 큰 영역만 alpha=0 처리

원본은 Saved/_pre_clean_backup/towers/ 에 백업.
"""
from PIL import Image
import numpy as np
from scipy import ndimage
import os
import shutil

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TOWERS_DIR = os.path.join(ROOT, 'assets', 'towers')
BACKUP_DIR = os.path.join(ROOT, 'Saved', '_pre_clean_backup', 'towers')

# 처리 대상 — (element, tier) 페어
TARGETS = [
    ('electric', 2),
    ('wind', 2),
]

ALPHA_THRESHOLD = 32
DILATE_PX = 40
MIN_REMOVE_PX = 200  # 200px 이상 떨어진 영역만 제거 (점 노이즈는 무시)

os.makedirs(BACKUP_DIR, exist_ok=True)


def make_disk(radius):
    y, x = np.ogrid[-radius:radius + 1, -radius:radius + 1]
    return x * x + y * y <= radius * radius


DISK = make_disk(DILATE_PX)
report = []

for elem, tier in TARGETS:
    path = os.path.join(TOWERS_DIR, elem, f't{tier}.png')
    if not os.path.exists(path):
        report.append(f'{elem}/t{tier}: NOT FOUND')
        continue

    img = Image.open(path).convert('RGBA')
    arr = np.array(img)
    alpha = arr[:, :, 3]
    binary = alpha > ALPHA_THRESHOLD

    labeled, num = ndimage.label(binary)
    if num <= 1:
        report.append(f'{elem}/t{tier}: clean (1 component)')
        continue

    # 메인 (가장 큰 컴포넌트)
    sizes = ndimage.sum(binary, labeled, range(num + 1))
    main_idx = sizes[1:].argmax() + 1
    main_mask = (labeled == main_idx)

    # 메인 + dilation = keep 영역
    keep_zone = ndimage.binary_dilation(main_mask, structure=DISK)

    # 외부의 큰 영역만 제거
    outside = binary & ~keep_zone
    out_labeled, out_num = ndimage.label(outside)
    out_sizes = ndimage.sum(outside, out_labeled, range(out_num + 1))

    remove_mask = np.zeros_like(binary, dtype=bool)
    removed = []
    for i in range(1, out_num + 1):
        if out_sizes[i] >= MIN_REMOVE_PX:
            remove_mask |= (out_labeled == i)
            removed.append(int(out_sizes[i]))

    if not remove_mask.any():
        report.append(f'{elem}/t{tier}: no significant outside region')
        continue

    backup_path = os.path.join(BACKUP_DIR, f'{elem}_t{tier}.png')
    if not os.path.exists(backup_path):
        shutil.copy2(path, backup_path)

    arr[remove_mask, 3] = 0
    Image.fromarray(arr).save(path)
    report.append(
        f'{elem}/t{tier}: REMOVED {len(removed)} foreign region(s) '
        f'sizes={removed}, main={int(sizes[main_idx])}px'
    )

print('=== 타워 스프라이트 정리 (화이트리스트) ===')
print('\n'.join(report))
