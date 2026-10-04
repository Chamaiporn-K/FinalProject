# Student Finance — Android / Expo

แอป Android เขียนด้วย TypeScript (.tsx), React Native components, StyleSheet และ Expo Router ไม่ใช้ HTML/CSS สำหรับเขียนหน้าจอ

## เปิดแอป

```sh
npm ci
npm start
```

เปิด Expo Go บนโทรศัพท์ Android แล้วสแกน QR หรือเปิด Android emulator ที่ติดตั้งไว้:

```sh
npm run android
```

API เชื่อม Backend ที่ `http://119.59.102.161:3012/api` ใช้ฐานข้อมูลออนไลน์เดิม ไม่ต้องนำเข้า SQL และไม่แก้ .env

## ตรวจสอบ

```sh
npm run typecheck
npm run check:android
```

check:android ตรวจการสร้าง JavaScript bundle และ assets สำหรับ Android โดยไม่คอมไพล์ Hermes bytecode เป็นการตรวจโค้ด ไม่ใช่การสร้าง APK หรือ release build

คำแนะนำเป็นสรุปจากกฎของ Backend เป้าหมายออมใช้ตาราง saving_goals เดิม ยังไม่มีข้อมูลยอดออมสะสม
