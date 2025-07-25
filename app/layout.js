import { Inter } from "next/font/google";
import "./globals.css";
import "./prism.css";
import { ClerkProvider } from "@clerk/nextjs";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";
const inter = Inter({
  variable: "--font-inder-sans",
  subsets: ["latin"],
});


export const metadata = {
  title: "Health Care App",
  description: "Generated by create next app",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <AppContextProvider>
        <html lang="en">
          <body
            className={`${inter.classname} antialiased`}
          >
            <Toaster toastOptions={
              {
                success: { style: { backgroundColor: 'black', color: 'white' } },
                error: { style: { backgroundColor: 'black', color: 'white' } }
              }
            } />
            {children}
          </body>
        </html>
      </AppContextProvider>
    </ClerkProvider>
  );
}
