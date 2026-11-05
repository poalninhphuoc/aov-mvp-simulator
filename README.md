# AOV KDA & MVP Rating Simulator

Công cụ phân tích & mô phỏng điểm MVP **Liên Quân Mobile (Arena of Valor)** — kéo thanh trượt K/D/A, chọn vai trò, xem ngay điểm trận đấu, hạng (C → SSS), danh hiệu MVP và phân rã từng thành phần điểm.

> Dự án không chính thức, không liên kết với Garena / Tencent. Công thức chỉ mang tính tham khảo.

## Tính năng

- Trang đầu chỉ có form nhập thông số; bấm **Tính toán** mới hiện bảng kết quả (preset tự tính luôn)
- 5 vai trò với trọng số riêng, KDA thuần, KP%, điểm đánh giá `3.0 – 16.0` (có soft-cap trên 11.0)
- Hạng C / B / A / S / SS / SSS với **hard-gate**: đủ điểm nhưng trượt điều kiện cứng sẽ bị hạ bậc và hiện rõ lý do
- Checklist mở khoá SSS / SS / S (✔ đạt, ✘ thiếu), phân rã điểm số, 4 preset kiểm thử
- Giao diện Esports dark mode, responsive (2 cột desktop / 1 cột mobile)

## Chạy local

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # test công thức tính điểm
npm run build    # xuất bản vào dist/
```

Stack: React 18, Vite, Tailwind CSS 3, lucide-react. Không cần thư viện biểu đồ (thanh CSS thuần).

## Công thức

```
RawKDA   = (K + A) / max(1, D)
KP%      = min(100, (K + A) / max(1, TeamKills) * 100)

Base     = 4.0 (thắng) | 3.3 (thua)
KdaScore = min(5.6, sqrt((K*wK + A*wA) / EffDeath) * 1.15)   EffDeath = D==0 ? 0.85 : D^0.85
ZeroDeath= (D==0 && K+A>=8) ? 0.6 : 0
KpScore  = (KP/100)^1.3 * 2.2
Combat   = (DmgDealt*wDmg + DmgTaken*wTank) * 0.042
Penalty  = -min(4.5, max(0, D - DmgTaken/(Tank|Support ? 18 : 30))^1.15 * 0.42)
Raw      = Base + KdaScore + ZeroDeath + KpScore + Combat + Tower + Badges + Penalty
Final    = clamp(3, 16, Raw > 11 ? 11 + (Raw-11)^0.8 : Raw)
```

Hạng: SSS cần điểm ≥ 14.2, thắng, ít chết, KP ≥ 72% và thống trị vai trò; SS cần điểm ≥ 12.3 cùng điều kiện cứng riêng; S cần ≥ 10.0 và chết ≤ 5; A 7.8–9.9; B 5.5–7.7; C < 5.5. Chi tiết trong [`src/lib/rating.js`](src/lib/rating.js).

## Triển khai GitHub Pages

Đặt `base: '/<tên-repo>/'` trong `vite.config.js`, chạy `npm run build` rồi publish thư mục `dist/`.

## Đóng góp

PR và issue luôn được chào đón: cân chỉnh công thức, thêm vai trò/huy hiệu, i18n, cải thiện UI. Hãy chạy `npm test` trước khi gửi PR.

## Giấy phép

[MIT](LICENSE)
