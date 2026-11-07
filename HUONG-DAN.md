# Dinosaur Game

Nguồn: https://poki.com/en/g/dinosaur-game

## Chạy game

Nhấp đúp START.cmd, rồi mở http://localhost:18772/. Chạy STOP.cmd để dừng nginx và trình tải của riêng game này. Máy cần có Node.js và curl.exe trong PATH; nginx Windows đã kèm trong runtime/nginx.

Nhấn Space hoặc mũi tên lên để bắt đầu và nhảy; chạm màn hình trên thiết bị cảm ứng.

## Cách tải

1. Dùng curl tải poki-page.html.
2. Gửi request đến iframe games.poki.com với Referer https://poki.com/ để lấy URL CDN trong window.PARAMS.gameUri. Bản HTML iframe lưu ở game-referer.html; HTML game gốc lưu ở index-original.html.
3. www/index.html giữ game gốc, chuyển URL SDK sang đường dẫn cache cục bộ và thêm favicon rỗng.
4. nginx phục vụ www. Khi file chưa có, error_page 404 chuyển request sang cache-game.cjs ở cổng 18773. Helper gọi curl, lưu file đúng đường dẫn vào www và trả nội dung ngay. Request sau dùng file có sẵn.
5. Download-All.ps1 tải các tài nguyên HTML thông qua nginx. Đã chạy và không có file tải thất bại.

## Các file hữu ích

- nginx.conf: cấu hình localhost và tải bù 404.
- game-config.json: URL CDN gốc và cổng.
- logs/downloads.jsonl: các request 404 và kết quả curl.
- logs/access.log: request nginx.
- logs/prefetch.json: kết quả tải theo manifest.
- download-manifest.json: danh sách 20 file trong www, dung lượng và SHA-256.
- preview.png: ảnh kiểm tra thực tế trong Chrome.
- verification.json: kết quả kiểm tra thường.
- verification-offline.json: kiểm tra khi chặn request Internet.

Game đã vào được màn chơi khi chặn Internet. SDK Poki gốc vẫn có thể gửi request dịch vụ/quảng cáo khi có mạng; lúc bị chặn SDK có thể báo lỗi fetch trong console. Không thay thế hoặc giả lập SDK. File còn thiếu chỉ tải được khi có mạng.
