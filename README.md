# DUY NE - 3D Web Environment Project

Chào mừng bạn đến với dự án **DUY NE**, một thế giới web 3D tương tác sống động được xây dựng bằng Three.js. Dự án này tạo ra một không gian nghệ thuật số với hiệu ứng vật liệu khúc xạ, hạt ánh sáng huyền ảo và video tích hợp trực tiếp trong không gian 3D.

## 🌟 Tính năng chính

- **Thế giới 3D tương tác**: Sử dụng Three.js để tạo ra một không gian 3D bao la với bầu trời (skybox) và hiệu ứng sương mù.
- **Quả cầu pha lê (Crystal Ball)**: Một vật thể trung tâm với vật liệu khúc xạ (refraction) và phản chiếu (reflection) thời gian thực.
- **Tích hợp Video**: Phát video trực tiếp trên một tấm màn 3D trong không gian.
- **Hiệu ứng Hạt (Magic Particles)**: Hệ thống hạt ánh sáng (sparkles) chuyển động và thay đổi màu sắc liên tục, tạo cảm giác huyền bí.
- **Văn bản 3D (3D Text)**: Các thông điệp được dựng dưới dạng khối 3D trong không gian (`VO DAY LAM CAI CHI???`, `LO VO ROI THI BAM GIU 'F' DI`).
- **Khối Album**: Một khối lập phương hiển thị các hình ảnh đặc biệt, bao gồm cả "loichuc.png" và "maingan.png".

## 🎮 Hướng dẫn điều khiển

Người dùng có thể tương tác với thế giới qua bàn phím:

- **Giữ phím `F`**: Di chuyển camera tiến về phía trước một cách mượt mà.
- **Phím `P`**: Phát (Play) video trên màn hình 3D.
- **Phím `Space` (Dấu cách)**: Tạm dừng (Pause) video.
- **Phím `S`**: Dừng hẳn video và quay lại thời điểm bắt đầu.
- **Phím `R`**: Tua nhanh (Rewind) video về đầu.
- **Chuột**: Kéo để xoay góc nhìn, lăn chuột để phóng to/thu nhỏ (Orbit Controls).

## 🛠 Công nghệ sử dụng

- **[Three.js](https://threejs.org/)**: Thư viện chính để dựng đồ họa 3D.
- **Detector.js**: Kiểm tra hỗ trợ WebGL của trình duyệt.
- **OrbitControls**: Điều hướng camera bằng chuột/cảm ứng.
- **THREEx Tools**: Các tiện ích mở rộng cho Three.js như KeyboardState, WindowResize và FullScreen.
- **jQuery**: Hỗ trợ các tác vụ DOM và logic phụ trợ.

## 📂 Cấu trúc thư mục

- `/css`: Chứa các tệp định dạng giao diện (Animate.css, Custom.css, Stylesheet.css).
- `/js`: Chứa mã nguồn logic 3D và các thư viện hỗ trợ.
- `/images`: Chứa kết cấu (textures) cho bầu trời, quả cầu và các vật thể 3D.
- `/videos`: Chứa tệp video `maingan.mp4` hiển thị trong không gian.
- `/fonts`: Chứa các kiểu chữ dùng để dựng Text 3D.

## 🚀 Cách khởi chạy

Đơn giản chỉ cần mở tệp `index.html` trong bất kỳ trình duyệt web hiện đại nào có hỗ trợ WebGL (Chrome, Firefox, Edge, Safari).

---
*Dự án được lấy cảm hứng từ thế giới nghệ thuật số WebGL.*
