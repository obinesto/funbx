import Footer from "@/components/global/Footer";

export default function DashboardShell({ children }) {
  return (
    <main className="h-full min-h-0 min-w-0 overflow-hidden bg-transparent text-foreground dark:text-foreground">
      <div className="h-full overflow-y-auto overflow-x-hidden overscroll-contain">
        <div className="flex min-h-full w-full flex-col">
          <div className="mx-auto w-full max-w-[2000px] flex-1 px-4 py-4 sm:px-6 lg:px-8">
            {children}
          </div>
          <Footer />
        </div>
      </div>
    </main>
  );
}
