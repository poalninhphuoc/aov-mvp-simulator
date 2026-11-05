# AOV KDA & MVP Rating Simulator

Công cụ phân tích & mô phỏng điểm MVP **Liên Quân Mobile (Arena of Valor)** — kéo thanh trượt K/D/A, chọn vai trò, xem ngay điểm trận đấu, hạng (C → SSS), danh hiệu MVP và phân rã từng thành phần điểm.

> Dự án không chính thức, không liên kết với Garena / Tencent. Công thức chỉ mang tính tham khảo.

## Tính năng

- 5 vai trò với trọng số riêng (Xạ thủ/Pháp sư, Sát thủ, Đấu sĩ, Trợ thủ, Đỡ đòn)
- KDA thuần, nhãn **PERFECT KDA**, KP% với thanh tiến trình
- Điểm trận `3.0 – 16.0`, hạng C/B/A/S/SS/SSS, **MVP Thắng** (vàng) / **MVP Bại** (tím) / **MVP Siêu Cấp**
- Biểu đồ phân rã điểm: nền, K/D/A, KP, sát thương & chống chịu, đẩy trụ & huy hiệu, phạt nằm xuống
- Tư vấn chiến thuật tự động, 4 preset mẫu
- Giao diện Esports dark mode, glassmorphism, responsive (2 cột desktop / 1 cột mobile)

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

Base     = 4.2 (thắng) | 3.6 (thua)
KdaScore = min(5.2, (K*wKill + A*wAssist) / max(1, D^0.75) * 0.42)   (+0.5 nếu D=0 và K+A>=5)
KpScore  = KP/100 * 2.4
Combat   = (DmgDealt*wDmg + DmgTaken*wTank) * 0.045
Penalty  = -min(4, max(0, D - DmgTaken/12) * 0.35)
Rating   = clamp(3, 16, Base + KdaScore + KpScore + Combat + Tower + Badges + Penalty)
```

Trọng số vai trò và điểm thưởng nằm trong [`src/lib/rating.js`](src/lib/rating.js) — dễ chỉnh để khớp thực tế hơn.

## Triển khai GitHub Pages

Đặt `base: '/<tên-repo>/'` trong `vite.config.js`, chạy `npm run build` rồi publish thư mục `dist/`.

## Đóng góp

PR và issue luôn được chào đón: cân chỉnh công thức, thêm vai trò/huy hiệu, i18n, cải thiện UI. Hãy chạy `npm test` trước khi gửi PR.

## Giấy phép

[MIT](LICENSE)
