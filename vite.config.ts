import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 상대 경로로 빌드해 사내 서버의 하위 경로나 정적 호스팅 어디에 올려도 동작하게 한다
  base: './',
  build: {
    // 아이콘 데이터(src/generated)는 코드와 따로 묶어, 코드만 바뀌었을 때 브라우저 캐시를 살린다
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('/src/generated/') ? 'icon-data' : id.includes('node_modules') ? 'vendor' : undefined),
      },
    },
  },
  test: { environment: 'node' },
});
