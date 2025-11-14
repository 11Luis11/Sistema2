REM Limpiar la caché de Next.js (Windows)
rmdir /s /q .next 2>nul
rmdir /s /q node_modules\.cache 2>nul
npm run dev
