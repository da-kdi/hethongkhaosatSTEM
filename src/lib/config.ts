/** Cấu hình ứng dụng từ biến môi trường (xem .env.example). */
export const APP_NAME = import.meta.env.VITE_APP_NAME ?? "Quản trị STEM";
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** demo: dữ liệu giả định trong trình duyệt · supabase: backend thật (bật ở M1) */
export const DATA_MODE: "demo" | "supabase" = SUPABASE_URL && SUPABASE_ANON_KEY ? "supabase" : "demo";
