import { Poppins } from "next/font/google";
import "./globals.scss";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import ThemeRegistry from "./providers/ThemeRegistry";
import SocketProvider from "./providers/SocketProvider";
import AuthHydrator from "./components/AuthHydrator";
import AppLayout from "./components/AppLayout";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "WABA Module",
  description: "WhatsApp Business API Module",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={poppins.variable}>
        <AuthHydrator>
          <SocketProvider>
            <AppRouterCacheProvider>
              <ThemeRegistry>
                <AppLayout>{children}</AppLayout>
              </ThemeRegistry>
            </AppRouterCacheProvider>
          </SocketProvider>
        </AuthHydrator>
      </body>
    </html>
  );
}
