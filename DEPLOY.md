# Dinosaur Game production

Trong thư mục D:\ANT_1\GAME\dinosaur-game-main chạy:

    docker compose up -d --build

Mở http://localhost:12726/ để kiểm tra. Production dùng https://dino.antfootage.net/.
Domain chỉ hoạt động sau khi trỏ DNS A/AAAA về server và cấu hình HTTPS reverse proxy. Mẫu Caddy ở deploy/Caddyfile chạy trên host. Nếu dùng proxy trong Docker, đặt cùng Docker network và proxy tới game:8080 thay cho 127.0.0.1.

Routes:
- /: mở thẳng game toàn màn hình (SEO meta trong head, không landing page).
- /embed: game tràn khung, cho phép iframe từ mọi domain (Content-Security-Policy: frame-ancestors *, X-Robots-Tag: noindex, follow, không có X-Frame-Options). /embed/ chuyển hướng 308 về /embed (giữ query).
- /dinosaur-game/: file tĩnh của game (ảnh, âm thanh, font).
- /seo/dinosaur-game-og.png: ảnh chia sẻ 1200x630; /seo/dinosaur-game-icon.png: icon.
- /robots.txt, /sitemap.xml, /healthz.

Mã nhúng:

    <iframe src="https://dino.antfootage.net/embed?lang=vi" title="Dinosaur Game" width="960" height="540" style="width:100%;aspect-ratio:16/9;height:auto;border:0" allow="autoplay;fullscreen;gamepad" allowfullscreen loading="lazy"></iframe>

Vùng chơi gốc là 600x150 (4:1). Bản production phóng to vùng chơi theo khung (tối đa 4 lần, pixel giữ nét) và căn giữa trên nền #f7f7f7, nên khung tỉ lệ nào cũng dùng được; 16:9 hoặc 2:1 là đẹp nhất. Khung hẹp hơn 600px giữ cách chạy gốc của game (canvas hẹp lại, không thu nhỏ).

Ngôn ngữ:
- Tham số URL ?lang=vi hoặc ?lang=en. Mặc định tiếng Việt; không bao giờ dùng ngôn ngữ trình duyệt.
- Trang cha đổi ngôn ngữ trực tiếp, không tải lại: iframe.contentWindow.postMessage({ type: 'ant-play:locale', locale: 'en' }, '*').
- Tiếng Việt: dòng hướng dẫn "Nhấn Space hoặc chạm để chơi / chơi lại / tiếp tục", "KẾT THÚC" thay GAME OVER, "KỶ LỤC" thay HI. Sprite gốc chỉ có chữ tiếng Anh nên chữ tiếng Việt vẽ bằng font pixel VT323 đóng gói sẵn trong dinosaur-game/fonts (SIL OFL, kèm file giấy phép). Tiếng Anh giữ sprite gốc.
- Logic trong deploy/public/dinosaur-game/ant-i18n.js, các điểm sửa trong index.html có chú thích "ANT Play".

Proxy/CDN phía trước không được thêm X-Frame-Options DENY/SAMEORIGIN hoặc CSP frame-ancestors 'self' cho route embed. CORS không cần để nhúng iframe. Trang cha có CSP phải cho phép https://dino.antfootage.net trong frame-src.

SITE_URL là origin công khai cho canonical, Open Graph và sitemap; thay trong .env rồi docker compose up -d. Không đặt đường dẫn hoặc dấu / cuối. APP_PORT mặc định 12726, bind loopback cho reverse proxy. Đổi BIND_ADDRESS=0.0.0.0 nếu cần truy cập trực tiếp từ mạng.

Bản production là file tĩnh, không gọi Poki hay bất kỳ host bên ngoài nào và không tải bù 404 từ Internet. Đã kiểm tra đủ file trong download-manifest.json. local-sdk.js thay SDK quảng cáo Poki: không có quảng cáo, commercial break sau mỗi lần thua kết thúc ngay để chơi tiếp. Game không có kiểm tra hostname/site-lock. Bản tải gốc và công cụ chạy local (START.cmd, nginx.conf, runtime/) vẫn giữ nguyên trong www/.

embed-focus.js đưa focus bàn phím vào khung game khi người chơi bấm hoặc chạm, nên phím Space hoạt động trong iframe sau cú bấm đầu tiên. Không thêm header Cross-Origin-Embedder-Policy yêu cầu CORP vì có thể ngăn nhúng chéo domain.

## Deploy HTTPS bằng Docker Caddy
Trên server đã trỏ DNS dino.antfootage.net về đúng IP, mở cổng 80/443 rồi chạy:

    docker compose -f compose.yaml -f compose.production.yaml up -d --build

Caddy tự cấp/gia hạn HTTPS và proxy tới game:8080 trong cùng Docker network. Nếu server đã dùng Nginx Proxy Manager/Traefik/Caddy khác, chỉ chạy compose.yaml và cấu hình proxy hiện có tới cổng 12726; không chạy thêm Caddy chiếm cổng 80/443.

Kiểm tra sau deploy:

    curl -I https://dino.antfootage.net/embed

Phải có Content-Security-Policy: frame-ancestors * và X-Robots-Tag: noindex, follow. Sau đó mở trang webgame và bấm Play now.
